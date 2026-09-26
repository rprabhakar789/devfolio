/**
 * knowledge-base.js
 * Loads the checked-in portfolio knowledge base that is injected into the
 * system prompt for every AI provider call. This is what makes the model aware
 * of devfolio's YAML content contracts at runtime.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const KNOWLEDGE_BASE_PATH = join(HERE, '..', 'docs', 'portfolio-agent-knowledge-base.md');

let cached = null;

/**
 * @returns {string} knowledge base markdown, or '' when unavailable.
 */
export function loadKnowledgeBase() {
  if (cached !== null) {
    return cached;
  }

  try {
    cached = readFileSync(KNOWLEDGE_BASE_PATH, 'utf8').trim();
  } catch (error) {
    console.warn(`[knowledge-base] Could not read ${KNOWLEDGE_BASE_PATH}: ${error.message}`);
    cached = '';
  }

  return cached;
}

/** Test helper — clears the module-level cache. */
export function resetKnowledgeBaseCache() {
  cached = null;
}
