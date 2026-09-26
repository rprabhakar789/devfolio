/**
 * content-model.js
 * Single source of truth for which content files the agent may touch and
 * what shape each file has. Everything else in the pipeline derives from this.
 */

export const CONTENT_DIR = 'content';

/** @type {Record<string, {format: 'yaml'|'markdown', root: 'array'|'object'|'text'}>} */
export const CONTENT_FILES = {
  'content/about.md': { format: 'markdown', root: 'text' },
  'content/contact.yaml': { format: 'yaml', root: 'object' },
  'content/education.yaml': { format: 'yaml', root: 'array' },
  'content/experience.yaml': { format: 'yaml', root: 'array' },
  'content/projects.yaml': { format: 'yaml', root: 'array' },
  'content/skills.yaml': { format: 'yaml', root: 'array' }
};

export const ALLOWED_FILES = Object.keys(CONTENT_FILES);

export function getFileContract(file) {
  return CONTENT_FILES[file] ?? null;
}

export function isAllowedFile(file) {
  return Object.hasOwn(CONTENT_FILES, file);
}
