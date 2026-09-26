#!/usr/bin/env node
/**
 * agent.js — portfolio content update pipeline entry point.
 *
 * Usage:
 *   node pipeline/agent.js --instruction "Add Rust to my languages"
 *   node pipeline/agent.js --json '{"instruction":"…","operations":[…]}'
 *   INSTRUCTION="…" node pipeline/agent.js
 *
 * Environment:
 *   INSTRUCTION            free-text instruction (alternative to --instruction)
 *   UPDATE_PROVIDER        optional provider override (default: llm-ops)
 *   AZURE_OPENAI_API_KEY / _ENDPOINT / _DEPLOYMENT   Azure OpenAI credentials
 *   AZURE_OPENAI_API_VERSION / _TEMPERATURE          optional Azure tuning
 *   OPENAI_API_KEY / OPENAI_MODEL                    OpenAI fallback
 *   AI_DEBUG_RESPONSE      set to "false" to silence model-output logging
 *
 * Exit codes:
 *   0  success (changes applied, or nothing to do)
 *   1  bad input / validation error / edit failure
 *   2  changes applied AND auto-merge intent detected
 */

import { appendFileSync } from 'node:fs';
import { resolveProviderName, runUpdateProvider } from './update-providers/index.js';

function parseArgs(argv) {
  let instruction = process.env.INSTRUCTION || null;
  let directOps = null;
  let providerOverride = null;

  for (let i = 0; i < argv.length; i += 1) {
    const next = argv[i + 1];
    if (argv[i] === '--instruction' && next) {
      instruction = argv[++i];
    } else if (argv[i] === '--json' && next) {
      const payload = JSON.parse(argv[++i]);
      instruction = payload.instruction || instruction;
      directOps = payload.operations || null;
    } else if (argv[i] === '--provider' && next) {
      providerOverride = argv[++i];
    }
  }

  return { instruction, directOps, providerOverride };
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function computeExitCode(result) {
  if (result.status === 'error' || result.status === 'unsupported') {
    return 1;
  }
  return result.status === 'applied' && result.autoMerge ? 2 : 0;
}

async function main() {
  const { instruction, directOps, providerOverride } = parseArgs(process.argv.slice(2));

  if (!instruction && !directOps) {
    console.error('[agent] No instruction provided. Use --instruction "<text>" or --json \'{"instruction":"…"}\'');
    process.exit(1);
  }

  const provider = resolveProviderName(providerOverride);
  console.log(`[agent] Starting pipeline with provider: ${provider}`);

  const result = await runUpdateProvider(provider, { instruction, directOps });
  console.log(`[agent] Provider result: status=${result.status}; message=${result.message || 'n/a'}`);

  writeOutput('provider', provider);
  writeOutput('status', result.status || 'error');
  writeOutput('auto_merge', result.autoMerge ? 'true' : 'false');
  writeOutput('changed_files', (result.changedFiles || []).join(' '));
  writeOutput('summary', (result.message || '').replaceAll('\n', ' '));

  const exitCode = computeExitCode(result);
  if (exitCode === 2) {
    console.log('[agent] Exiting with code 2 to signal auto-merge intent to the caller.');
  }
  process.exit(exitCode);
}

main().catch((error) => {
  console.error('[agent] Unhandled error:', error);
  process.exit(1);
});
