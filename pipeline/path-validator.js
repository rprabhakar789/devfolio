/**
 * path-validator.js
 * Fail-fast guard: the agent may only ever write to known files under content/.
 */

import path from 'node:path';
import process from 'node:process';

import { ALLOWED_FILES, CONTENT_DIR, isAllowedFile } from './content-model.js';

export class PathValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PathValidationError';
  }
}

/**
 * Validates a repo-relative content path and returns its absolute path.
 * @param {string} file
 * @param {string} [rootDir]
 * @returns {string} absolute path on disk
 */
export function validatePath(file, rootDir = process.cwd()) {
  if (typeof file !== 'string' || file.trim().length === 0) {
    throw new PathValidationError('Edit target file must be a non-empty string');
  }

  const normalized = path.posix.normalize(file.trim().replaceAll('\\', '/'));

  if (path.isAbsolute(normalized) || normalized.startsWith('..')) {
    throw new PathValidationError(`Refusing to edit path outside the repository: "${file}"`);
  }

  if (!normalized.startsWith(`${CONTENT_DIR}/`)) {
    throw new PathValidationError(`Refusing to edit "${file}" — only files under ${CONTENT_DIR}/ may be changed`);
  }

  if (!isAllowedFile(normalized)) {
    throw new PathValidationError(
      `Refusing to edit "${file}" — allowed content files are: ${ALLOWED_FILES.join(', ')}`
    );
  }

  const absolute = path.resolve(rootDir, normalized);
  const contentRoot = path.resolve(rootDir, CONTENT_DIR);

  if (!absolute.startsWith(contentRoot + path.sep)) {
    throw new PathValidationError(`Resolved path escapes ${CONTENT_DIR}/: "${file}"`);
  }

  return absolute;
}

/**
 * Validates every path, throwing on the first violation.
 * @param {string[]} files
 */
export function validatePaths(files, rootDir = process.cwd()) {
  return files.map((file) => validatePath(file, rootDir));
}
