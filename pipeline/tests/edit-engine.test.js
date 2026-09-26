import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import YAML from 'yaml';

import { applyEdits } from '../edit-engine.js';
import { runLlmOpsProvider } from '../update-providers/llm-ops.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

let workdir;

before(() => {
  workdir = mkdtempSync(join(tmpdir(), 'devfolio-agent-'));
  cpSync(join(REPO_ROOT, 'content'), join(workdir, 'content'), { recursive: true });
});

after(() => {
  rmSync(workdir, { recursive: true, force: true });
});

const read = (file) => readFileSync(join(workdir, file), 'utf8');
const readYaml = (file) => YAML.parse(read(file));

test('untouched files are never rewritten', () => {
  const before = read('content/experience.yaml');
  applyEdits([{ file: 'content/skills.yaml', op: 'append', key: '', value: { category: 'Temp', items: ['x'] } }], workdir);
  assert.equal(read('content/experience.yaml'), before);

  applyEdits([{ file: 'content/skills.yaml', op: 'remove', key: '', value: { category: 'Temp' } }], workdir);
});

test('appending a skill by category selector only changes that category', () => {
  const before = readYaml('content/skills.yaml');
  const languagesBefore = before.find((entry) => entry.id === 'languages').items.length;

  const result = applyEdits(
    [{ file: 'content/skills.yaml', op: 'append', key: '[id=languages].items', value: { name: 'Rust', level: 70 } }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  assert.equal(result.applied, 1);
  assert.deepEqual(result.changedFiles, ['content/skills.yaml']);

  const after = readYaml('content/skills.yaml');
  const languages = after.find((entry) => entry.id === 'languages');
  assert.equal(languages.items.length, languagesBefore + 1);
  assert.deepEqual(languages.items.at(-1), { name: 'Rust', level: 70 });
  assert.equal(after.length, before.length);
});

test('removal matches an entry by a subset of its fields', () => {
  const result = applyEdits(
    [{ file: 'content/skills.yaml', op: 'remove', key: '[id=languages].items', value: { name: 'Rust' } }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  const languages = readYaml('content/skills.yaml').find((entry) => entry.id === 'languages');
  assert.ok(!languages.items.some((item) => item.name === 'Rust'));
});

test('yaml round-trips cleanly when an operation is a no-op', () => {
  const before = read('content/contact.yaml');
  const existingEmail = YAML.parse(before).email;

  const result = applyEdits(
    [{ file: 'content/contact.yaml', op: 'set', key: 'email', value: existingEmail }],
    workdir
  );

  assert.deepEqual(result.changedFiles, []);
  assert.equal(read('content/contact.yaml'), before);
});

test('nested object keys can be set', () => {
  const result = applyEdits(
    [{ file: 'content/contact.yaml', op: 'set', key: 'links.github', value: 'https://github.com/example' }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  assert.equal(readYaml('content/contact.yaml').links.github, 'https://github.com/example');
});

test('appending to a list that does not exist yet creates it', () => {
  const projects = readYaml('content/projects.yaml');
  const name = projects[0].name;

  const result = applyEdits(
    [{ file: 'content/projects.yaml', op: 'append', key: `[name=${name}].technologies`, value: 'Node.js' }],
    workdir
  );

  assert.deepEqual(result.errors, []);
  assert.ok(readYaml('content/projects.yaml')[0].technologies.includes('Node.js'));
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
    directOps: [
      { file: 'content/skills.yaml', op: 'append', key: '[id=languages].items', value: 'Elixir (Beginner)' }
    ],
    rootDir: workdir
  });

  assert.equal(result.status, 'applied');
  const languages = readYaml('content/skills.yaml').find((entry) => entry.id === 'languages');
  assert.deepEqual(languages.items.at(-1), { name: 'Elixir', level: 60 });
});

test('llm-ops fails when non-empty operations produce no diff', async () => {
  const contact = readYaml('content/contact.yaml');

  const result = await runLlmOpsProvider({
    directOps: [{ file: 'content/contact.yaml', op: 'set', key: 'email', value: contact.email }],
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
