/**
 * update-providers/index.js
 * Dependency-injection boundary for "how does an instruction become a change?".
 *
 * Today there is a single provider (`llm-ops`): the AI provider parses the
 * instruction into operations and the deterministic edit engine applies them.
 * Additional providers can be registered here without touching agent.js.
 */

import { runLlmOpsProvider } from './llm-ops.js';

export const PROVIDERS = {
  'llm-ops': runLlmOpsProvider
};

export const DEFAULT_PROVIDER = 'llm-ops';

export function resolveProviderName(explicitProvider) {
  for (const candidate of [explicitProvider, process.env.UPDATE_PROVIDER]) {
    if (!candidate) {
      continue;
    }
    const normalized = String(candidate).trim().toLowerCase();
    if (normalized in PROVIDERS) {
      return normalized;
    }
    console.warn(`[update-providers] Unknown provider "${candidate}" — ignoring.`);
  }

  return DEFAULT_PROVIDER;
}

export async function runUpdateProvider(providerName, context) {
  const selected = resolveProviderName(providerName);
  return PROVIDERS[selected](context);
}
