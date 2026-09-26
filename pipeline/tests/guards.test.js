import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PathValidationError, validatePath } from '../path-validator.js';
import { detectAutoMergeIntent, matchedPhrases } from '../intent-detector.js';
import { parseKeyPath } from '../edit-engine.js';

test('validatePath accepts every allowed content file', () => {
  for (const file of [
    'content/about.md',
    'content/contact.yaml',
    'content/experience.yaml',
    'content/education.yaml',
    'content/projects.yaml',
    'content/skills.yaml'
  ]) {
    assert.ok(validatePath(file, '/repo').endsWith(file));
  }
});

test('validatePath rejects paths outside content/', () => {
  for (const file of ['package.json', 'src/App.jsx', '../secrets.yaml', '/etc/passwd', 'content/../package.json']) {
    assert.throws(() => validatePath(file, '/repo'), PathValidationError, `expected rejection for ${file}`);
  }
});

test('validatePath rejects unknown files inside content/', () => {
  assert.throws(() => validatePath('content/hacked.yaml', '/repo'), PathValidationError);
});

test('detectAutoMergeIntent matches the documented phrases', () => {
  assert.equal(detectAutoMergeIntent('Add Rust then merge and deploy'), true);
  assert.equal(detectAutoMergeIntent('Please PUBLISH THIS now'), true);
  assert.equal(detectAutoMergeIntent('ship this'), true);
  assert.equal(detectAutoMergeIntent('Add Rust to my languages'), false);
  assert.deepEqual(matchedPhrases('go live and publish this'), ['publish this', 'go live']);
});

test('parseKeyPath understands dots, indices and selectors', () => {
  assert.deepEqual(parseKeyPath(''), []);
  assert.deepEqual(parseKeyPath('links.github'), [
    { type: 'key', value: 'links' },
    { type: 'key', value: 'github' }
  ]);
  assert.deepEqual(parseKeyPath('0.summary'), [
    { type: 'index', value: '0' },
    { type: 'key', value: 'summary' }
  ]);
  assert.deepEqual(parseKeyPath('[id=languages].items'), [
    { type: 'selector', field: 'id', value: 'languages' },
    { type: 'key', value: 'items' }
  ]);
});

test('parseKeyPath keeps dots inside selector values', () => {
  assert.deepEqual(parseKeyPath('[name=Node.js]'), [{ type: 'selector', field: 'name', value: 'Node.js' }]);
});

test('parseKeyPath rejects malformed selectors', () => {
  assert.throws(() => parseKeyPath('[id=languages'), /Unterminated selector/);
  assert.throws(() => parseKeyPath('[languages]'), /\[field=value\]/);
});
