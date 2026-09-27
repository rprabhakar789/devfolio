import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import YAML from 'yaml';

import { applyEdits } from '../edit-engine.js';
import { runLlmOpsProvider } from '../update-providers/llm-ops.js';
import { CONTENT_FIXTURES } from './fixtures.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let workdir;

// Each test gets a pristine fixture tree. Tests deliberately do NOT copy the
// live content/ directory — the agent edits those files, so depending on their
// contents would make CI fail whenever the portfolio is updated.
beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'devfolio-agent-'));
  mkdirSync(join(workdir, 'content'), { recursive: true });
  for (const [file, contents] of Object.entries(CONTENT_FIXTURES)) {
    writeFileSync(join(workdir, file), contents, 'utf8');
  }
});

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true });
});

const read = (file) => readFileSync(join(workdir, file), 'utf8');
const readYaml = (file) => YAML.parse(read(file));
const languages = () => readYaml('content/skills.yaml').find((entry) => entry.id === 'languages');

test('untouched files are never rewritten', () => {
  const before = read('content/experience.yaml');

  applyEdits(
    [{ file: 'content/skills.yaml', op: 'append', key: '[id=languages].items', value: { name: 'Rust', level: 70 } }],
    workdir
  );

  assert.equal(read('content/experience.yaml'), before);
});

test('appending a skill by category selector only changes that category', () => {
  const before = readYaml('content/skills.yaml');
  const countBefore = before.find((entry) => entry.id === 'languages').items.length;

  const result = applyEdits(
    [{ file: 'content/skills.yaml', op: 'append', key: '[id=languages].items', value: { name: 'Rust', level: 70 } }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  assert.equal(result.applied, 1);
  assert.deepEqual(result.changedFiles, ['content/skills.yaml']);

  const after = readYaml('content/skills.yaml');
  assert.equal(languages().items.length, countBefore + 1);
  assert.deepEqual(languages().items.at(-1), { name: 'Rust', level: 70 });
  assert.equal(after.length, before.length);
  assert.deepEqual(
    after.find((entry) => entry.id === 'frameworks'),
    before.find((entry) => entry.id === 'frameworks')
  );
});

test('removal matches an entry by a subset of its fields', () => {
  applyEdits(
    [{ file: 'content/skills.yaml', op: 'append', key: '[id=languages].items', value: { name: 'Rust', level: 70 } }],
    workdir
  );
  assert.ok(languages().items.some((item) => item.name === 'Rust'));

  const result = applyEdits(
    [{ file: 'content/skills.yaml', op: 'remove', key: '[id=languages].items', value: { name: 'Rust' } }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  assert.ok(!languages().items.some((item) => item.name === 'Rust'));
});

test('removing a skill leaves its siblings untouched', () => {
  applyEdits(
    [{ file: 'content/skills.yaml', op: 'remove', key: '[id=languages].items', value: { name: 'Java' } }],
    workdir
  );

  assert.deepEqual(languages().items.map((item) => item.name), ['SQL']);
});

test('yaml round-trips cleanly when an operation is a no-op', () => {
  const before = read('content/contact.yaml');

  const result = applyEdits(
    [{ file: 'content/contact.yaml', op: 'set', key: 'email', value: readYaml('content/contact.yaml').email }],
    workdir
  );

  assert.deepEqual(result.changedFiles, []);
  assert.equal(read('content/contact.yaml'), before);
});

test('the real content files round-trip through the engine without diffs', () => {
  // Content-independent: asserts only that parsing and re-serializing the live
  // files is lossless, never that they contain any particular entry.
  for (const file of ['skills.yaml', 'projects.yaml', 'experience.yaml', 'education.yaml', 'contact.yaml']) {
    const source = readFileSync(join(REPO_ROOT, 'content', file), 'utf8');
    const doc = YAML.parseDocument(source);
    assert.deepEqual(doc.errors, [], `${file} should parse cleanly`);
    assert.equal(doc.toString({ lineWidth: 0 }), source, `${file} should re-serialize byte-identically`);
  }
});

test('nested object keys can be set', () => {
  const result = applyEdits(
    [{ file: 'content/contact.yaml', op: 'set', key: 'links.github', value: 'https://github.com/changed' }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  const contact = readYaml('content/contact.yaml');
  assert.equal(contact.links.github, 'https://github.com/changed');
  assert.equal(contact.links.linkedin, 'https://linkedin.com/in/example');
});

test('appending to a nested list works', () => {
  const result = applyEdits(
    [{ file: 'content/projects.yaml', op: 'append', key: '[name=TinyUrl].technologies', value: 'Node.js' }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(readYaml('content/projects.yaml')[0].technologies, ['Java', 'Redis', 'Node.js']);
});

test('appending a whole entry to the document root works', () => {
  applyEdits(
    [
      {
        file: 'content/projects.yaml',
        op: 'append',
        key: '',
        value: { name: 'New', summary: 'A new project.', technologies: ['Go'] }
      }
    ],
    workdir
  );

  const projects = readYaml('content/projects.yaml');
  assert.equal(projects.length, 2);
  assert.equal(projects[1].name, 'New');
});

test('markdown append adds a paragraph and remove takes it away', () => {
  const original = read('content/about.md');

  applyEdits([{ file: 'content/about.md', op: 'append', key: '', value: 'A test paragraph.' }], workdir);
  assert.ok(read('content/about.md').includes('A test paragraph.'));

  applyEdits([{ file: 'content/about.md', op: 'remove', key: '', value: 'A test paragraph.' }], workdir);
  assert.equal(read('content/about.md').trim(), original.trim());
});

test('markdown edits reject non-body keys', () => {
  const { errors, applied } = applyEdits(
    [{ file: 'content/about.md', op: 'set', key: 'headline', value: 'nope' }],
    workdir
  );
  assert.equal(applied, 0);
  assert.match(errors[0].error, /whole-document edits/);
});

test('selectors that match nothing produce an error instead of a silent no-op', () => {
  const { applied, errors } = applyEdits(
    [{ file: 'content/skills.yaml', op: 'append', key: '[id=does-not-exist].items', value: { name: 'X' } }],
    workdir
  );
  assert.equal(applied, 0);
  assert.match(errors[0].error, /No entry matching/);
});

test('edits outside content/ are rejected by the engine itself', () => {
  const { applied, errors } = applyEdits([{ file: 'package.json', op: 'set', key: 'name', value: 'pwned' }], workdir);
  assert.equal(applied, 0);
  assert.equal(errors.length, 1);
});

test('llm-ops reports applied changes for valid direct operations', async () => {
  const result = await runLlmOpsProvider({
    directOps: [{ file: 'content/skills.yaml', op: 'append', key: '[id=languages].items', value: 'Elixir (Beginner)' }],
    rootDir: workdir
  });

  assert.equal(result.status, 'applied');
  assert.deepEqual(languages().items.at(-1), { name: 'Elixir', level: 60 });
});

test('llm-ops fails when non-empty operations produce no diff', async () => {
  const result = await runLlmOpsProvider({
    directOps: [
      { file: 'content/contact.yaml', op: 'set', key: 'email', value: readYaml('content/contact.yaml').email }
    ],
    rootDir: workdir
  });

  assert.equal(result.status, 'error');
  assert.match(result.message, /no content diff/);
});

test('llm-ops fails when normalization cannot repair the operation', async () => {
  const result = await runLlmOpsProvider({
    directOps: [{ file: 'content/projects.yaml', op: 'append', key: 'projects', value: { name: 'X' } }],
    rootDir: workdir
  });

  assert.equal(result.status, 'error');
  assert.match(result.message, /normalization failed/i);
});

test('llm-ops refuses paths outside content/', async () => {
  const result = await runLlmOpsProvider({
    directOps: [{ file: 'src/App.jsx', op: 'set', key: 'x', value: 'y' }],
    rootDir: workdir
  });

  assert.equal(result.status, 'error');
  assert.match(result.message, /Path validation failed/);
});
