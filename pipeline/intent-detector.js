/**
 * intent-detector.js
 * Detects explicit auto-merge intent phrases in a free-text instruction.
 * Anything not on this list stays PR-first.
 */

export const AUTO_MERGE_PHRASES = [
  'merge and deploy',
  'auto merge',
  'automerge',
  'auto-merge',
  'publish this',
  'ship this',
  'go live'
];

function normalize(instruction) {
  if (typeof instruction !== 'string') {
    return '';
  }
  return instruction.toLowerCase();
}

/**
 * @param {string} instruction
 * @returns {boolean}
 */
export function detectAutoMergeIntent(instruction) {
  const text = normalize(instruction);
  if (!text) {
    return false;
  }
  return AUTO_MERGE_PHRASES.some((phrase) => text.includes(phrase));
}

/**
 * @param {string} instruction
 * @returns {string[]} the phrases that matched
 */
export function matchedPhrases(instruction) {
  const text = normalize(instruction);
  if (!text) {
    return [];
  }
  return AUTO_MERGE_PHRASES.filter((phrase) => text.includes(phrase));
}
