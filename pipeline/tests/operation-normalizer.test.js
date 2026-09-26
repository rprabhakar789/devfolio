import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizeOperations } from '../operation-normalizer.js';

const single = (op) => normalizeOperations([op], { debugEnabled: true });

test('wrapper keys collapse to the document root', () => {
  for (const [file, key] of [
    ['content/projects.yaml', 'projects'],
    ['content/skills.yaml', 'skills'],
    ['content/experience.yaml', 'experience']
  ]) {
    const { operations, errors } = single({
      file,
      op: 'remove',
      key,
      value: { name: 'x', company: 'x', role: 'x', period: 'x', institution: 'x', degree: 'x' }
    });
    assert.deepEqual(errors, []);
    assert.equal(operations[0].key, '');
  }
});

test('legacy project fields are remapped', () => {
  const { operations, errors } = single({
    file: 'content/projects.yaml',
    op: 'append',
    key: '',
    value: {
      title: 'TinyUrl',
      description: 'A URL shortener.',
      tags: 'Java, Redis',
      url: 'https://github.com/x/y'
    }
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(operations[0].value, {
    name: 'TinyUrl',
    summary: 'A URL shortener.',
    technologies: ['Java', 'Redis'],
    links: { github: 'https://github.com/x/y' },
    category: 'general'
  });
});

test('projects without technologies fail explicitly', () => {
  const { errors } = single({
    file: 'content/projects.yaml',
    op: 'append',
    key: '',
    value: { name: 'TinyUrl', summary: 'A URL shortener.' }
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0].error, /technologies/);
});

test('string skills become objects and word levels become numbers', () => {
  const { operations, errors } = single({
    file: 'content/skills.yaml',
    op: 'append',
    key: '[id=languages].items',
    value: 'Rust (Intermediate)'
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(operations[0].value, { name: 'Rust', level: 80 });
});

test('a bare skill string needs no level', () => {
  const { operations } = single({
    file: 'content/skills.yaml',
    op: 'append',
    key: '[id=languages].items',
    value: 'Rust'
  });
  assert.deepEqual(operations[0].value, { name: 'Rust' });
});

test('numeric skill levels pass through and are clamped', () => {
  const { operations } = single({
    file: 'content/skills.yaml',
    op: 'append',
    key: '[id=languages].items',
    value: { name: 'Go', level: '140' }
  });
  assert.deepEqual(operations[0].value, { name: 'Go', level: 100 });
});

test('unsupported skill levels fail explicitly', () => {
  const { errors } = single({
    file: 'content/skills.yaml',
    op: 'append',
    key: '[id=languages].items',
    value: { name: 'Go', level: 'quite good' }
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0].error, /unsupported level/);
});

test('new skill categories get a derived id and normalized items', () => {
  const { operations, errors } = single({
    file: 'content/skills.yaml',
    op: 'append',
    key: '',
    value: { category: 'Data Stores', items: ['Postgres (Expert)'] }
  });

  assert.deepEqual(errors, []);
  assert.deepEqual(operations[0].value, {
    category: 'Data Stores',
    id: 'data-stores',
    items: [{ name: 'Postgres', level: 95 }]
  });
});

test('experience entries require company, role and period', () => {
  const ok = single({
    file: 'content/experience.yaml',
    op: 'append',
    key: '',
    value: { title: 'SDE II', company: 'Microsoft', period: '2025 - Current' }
  });
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.operations[0].value.role, 'SDE II');

  const bad = single({
    file: 'content/experience.yaml',
    op: 'append',
    key: '',
    value: { company: 'Microsoft' }
  });
  assert.equal(bad.errors.length, 1);
});

test('removing the contact email is refused', () => {
  const { errors } = single({ file: 'content/contact.yaml', op: 'remove', key: 'email' });
  assert.equal(errors.length, 1);
  assert.match(errors[0].error, /Refusing to remove the contact email/);
});

test('about.md requires a non-empty string value', () => {
  assert.equal(single({ file: 'content/about.md', op: 'append', key: '', value: '  ' }).errors.length, 1);
  assert.deepEqual(
    single({ file: 'content/about.md', op: 'append', key: '', value: ' Hello.  ' }).operations[0].value,
    'Hello.'
  );
});

test('unknown op types fail', () => {
  const { errors } = single({ file: 'content/projects.yaml', op: 'upsert', key: '', value: {} });
  assert.match(errors[0].error, /Unknown op type/);
});
