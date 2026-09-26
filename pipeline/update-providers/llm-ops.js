/**
 * update-providers/llm-ops.js
 * Instruction -> AI operations -> normalisation -> path validation -> edits.
 */

import { isDebugEnabled, parseInstruction } from '../ai-provider.js';
import { applyEdits } from '../edit-engine.js';
import { detectAutoMergeIntent, matchedPhrases } from '../intent-detector.js';
import { normalizeOperations } from '../operation-normalizer.js';
import { PathValidationError, validatePath } from '../path-validator.js';

function summarize(operations) {
  if (!Array.isArray(operations) || operations.length === 0) {
    return 'count=0 files=[]';
  }
  const files = [...new Set(operations.map((op) => op?.file).filter(Boolean))];
  const opTypes = [...new Set(operations.map((op) => op?.op).filter(Boolean))];
  return `count=${operations.length} files=[${files.join(', ')}] ops=[${opTypes.join(', ')}]`;
}

const fail = (message, extra = {}) => ({
  provider: 'llm-ops',
  status: 'error',
  autoMerge: false,
  message,
  ...extra
});

export async function runLlmOpsProvider(context = {}) {
  const instruction = context.instruction || '';
  const directOps = Array.isArray(context.directOps) ? context.directOps : null;
  const rootDir = context.rootDir;
  const autoMerge = instruction ? detectAutoMergeIntent(instruction) : false;
  const debugEnabled = isDebugEnabled();

  if (autoMerge) {
    console.log(`[llm-ops] Auto-merge intent detected (matched: ${matchedPhrases(instruction).join(', ')})`);
  }

  let operations = directOps ?? [];

  if (instruction && operations.length === 0) {
    console.log('[llm-ops] Parsing instruction via AI provider…');
    const parsed = await parseInstruction(instruction);
    console.log(`[llm-ops] AI provider: ${parsed.provider} | Confidence: ${parsed.confidence}`);
    console.log(`[llm-ops] Summary: ${parsed.summary}`);
    operations = Array.isArray(parsed.operations) ? parsed.operations : [];
  }

  console.log(`[llm-ops] Raw operation summary: ${summarize(operations)}`);
  if (debugEnabled) {
    console.log(`[llm-ops][debug] operations_payload=${JSON.stringify(operations)}`);
  }

  const normalization = normalizeOperations(operations, { debugEnabled });

  if (debugEnabled) {
    for (const note of normalization.notes) {
      console.log(`[llm-ops][debug] normalization=${note}`);
    }
  }

  if (normalization.errors.length > 0) {
    for (const { op, error } of normalization.errors) {
      console.error(`[llm-ops] Normalization error on ${op?.file || 'unknown-file'}#${op?.key ?? ''}: ${error}`);
    }
    return fail('Operation normalization failed.', { errors: normalization.errors });
  }

  operations = normalization.operations;
  console.log(`[llm-ops] Normalized operation summary: ${summarize(operations)}`);
  if (debugEnabled) {
    console.log(`[llm-ops][debug] normalized_operations_payload=${JSON.stringify(operations)}`);
  }

  if (operations.length === 0) {
    return {
      provider: 'llm-ops',
      status: 'no_changes',
      autoMerge: false,
      message: 'No edit operations were generated.'
    };
  }

  for (const op of operations) {
    try {
      validatePath(op.file, rootDir);
    } catch (error) {
      if (error instanceof PathValidationError) {
        return fail(`Path validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  console.log('[llm-ops] Applying edits…');
  const { applied, errors, changedFiles } = applyEdits(operations, rootDir);

  for (const { op, error } of errors) {
    console.error(`[llm-ops] Edit error on ${op?.file}#${op?.key ?? ''}: ${error}`);
  }

  if (errors.length > 0 && applied === 0) {
    return fail('All edit operations failed.', { errors });
  }

  // A non-empty operation list that produces no diff means the model (or the
  // normalizer) misunderstood the content contract. Treat it as a hard failure
  // rather than shipping an empty PR.
  if (changedFiles.length === 0) {
    return fail(`Operations produced no content diff after normalization: ${summarize(operations)}`, {
      applied,
      errors
    });
  }

  return {
    provider: 'llm-ops',
    status: 'applied',
    autoMerge,
    applied,
    changedFiles,
    errors,
    message: `Applied ${applied} operation(s) across ${changedFiles.length} file(s): ${changedFiles.join(', ')}`
  };
}
