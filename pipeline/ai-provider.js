/**
 * ai-provider.js
 * AI integration boundary. This module is the ONLY place that talks to an
 * external AI API. With no credentials configured it returns a deterministic
 * stub so the pipeline still runs end-to-end.
 *
 * Provider selection order: Azure OpenAI → OpenAI → stub.
 *
 * parseInstruction(instruction) → Promise<{
 *   summary: string,
 *   operations: Array<{file, op, key, value?}>,
 *   confidence: number,
 *   provider: 'azure-openai' | 'openai' | 'stub'
 * }>
 */

import { loadKnowledgeBase } from './knowledge-base.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEBUG_MAX_CHARS = 2000;

/** Debug logging defaults to ON; set AI_DEBUG_RESPONSE=false to silence it. */
export function isDebugEnabled() {
  const raw = String(process.env.AI_DEBUG_RESPONSE ?? '').trim().toLowerCase();
  if (raw === '') {
    return true;
  }
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

function truncate(value, max = DEBUG_MAX_CHARS) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.length <= max ? value : `${value.slice(0, max)}… [truncated ${value.length - max} chars]`;
}

export function summarizeOperations(operations) {
  if (!Array.isArray(operations)) {
    return 'operations=0 files=[]';
  }
  const files = [...new Set(operations.map((op) => op?.file).filter(Boolean))];
  return `operations=${operations.length} files=[${files.join(', ')}]`;
}

/** Logs model output for troubleshooting. Never logs keys, headers or URLs. */
function logDebugResponse(provider, rawContent, parsed) {
  if (!isDebugEnabled()) {
    return;
  }
  console.log(`[ai-provider][debug] provider=${provider}`);
  console.log(`[ai-provider][debug] raw_message_content=${truncate(rawContent)}`);
  console.log(`[ai-provider][debug] parsed_summary=${summarizeOperations(parsed?.operations)}`);
  console.log(`[ai-provider][debug] parsed_operations=${truncate(JSON.stringify(parsed?.operations ?? []))}`);
}

const BASE_SYSTEM_PROMPT = `You are a portfolio content editor for a Vite + React portfolio site whose content lives in YAML and Markdown files under content/.

Return a JSON object with this exact shape and nothing else:
{
  "summary": "<one-sentence summary of the change>",
  "operations": [
    { "file": "content/<file>", "op": "set|append|remove", "key": "<key path>", "value": <any> }
  ],
  "confidence": <0.0 to 1.0>
}

Rules:
- Only these files may be edited: content/about.md, content/contact.yaml, content/experience.yaml, content/education.yaml, content/projects.yaml, content/skills.yaml.
- Use "" (empty string) as the key to target the document root. experience.yaml, education.yaml, projects.yaml and skills.yaml are ROOT ARRAYS — never wrap values in a { "projects": [...] } style object and never use "projects"/"skills" as a key.
- Key paths use dot notation and may address array entries by field selector instead of index, e.g. "[id=languages].items" or "[name=TinyUrl].summary".
- "append" adds one entry to an array, "set" replaces a value, "remove" deletes a value or an array entry matching the given value.
- Respond ONLY with valid JSON. No prose, no markdown code fences.`;

export function buildSystemPrompt() {
  const knowledgeBase = loadKnowledgeBase();
  if (!knowledgeBase) {
    return BASE_SYSTEM_PROMPT;
  }

  return `${BASE_SYSTEM_PROMPT}

Use the following checked-in knowledge base as the authoritative description of each file's schema:

${knowledgeBase}`;
}

/**
 * @param {string} instruction free-text instruction
 */
export async function parseInstruction(instruction) {
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (azureApiKey && azureEndpoint && azureDeployment) {
    try {
      return await azureOpenAIProvider(instruction, azureApiKey, azureEndpoint, azureDeployment);
    } catch (error) {
      console.error(`[ai-provider] Azure OpenAI call failed: ${error.message} — falling back to stub.`);
      return stubProvider(instruction);
    }
  }

  if (openaiApiKey) {
    try {
      return await openaiProvider(instruction, openaiApiKey);
    } catch (error) {
      console.error(`[ai-provider] OpenAI call failed: ${error.message} — falling back to stub.`);
      return stubProvider(instruction);
    }
  }

  console.warn('[ai-provider] No Azure OpenAI or OpenAI credentials found — using stub provider.');
  return stubProvider(instruction);
}

async function openaiProvider(instruction, apiKey) {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: instruction }
      ],
      temperature: 0,
      response_format: { type: 'json_object' }
    })
  });

  const content = await readChatContent(response, 'OpenAI');
  const parsed = JSON.parse(content);
  logDebugResponse('openai', content, parsed);
  return { ...parsed, provider: 'openai' };
}

async function azureOpenAIProvider(instruction, apiKey, endpoint, deployment) {
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';
  const base = endpoint.replace(/\/+$/, '');
  const url = `${base}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  const payload = {
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: instruction }
    ],
    response_format: { type: 'json_object' }
  };

  // Some Azure-hosted models reject any explicit temperature, so only send one
  // when it has been configured on purpose.
  const configuredTemperature = process.env.AZURE_OPENAI_TEMPERATURE;
  if (configuredTemperature !== undefined && configuredTemperature !== '') {
    const temperature = Number(configuredTemperature);
    if (Number.isFinite(temperature)) {
      payload.temperature = temperature;
    } else {
      console.warn('[ai-provider] AZURE_OPENAI_TEMPERATURE is not numeric; ignoring override.');
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  const content = await readChatContent(response, 'Azure OpenAI');
  const parsed = JSON.parse(content);
  logDebugResponse('azure-openai', content, parsed);
  return { ...parsed, provider: 'azure-openai' };
}

async function readChatContent(response, label) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Empty response from ${label}`);
  }
  return content;
}

function stubProvider(instruction) {
  console.log('[ai-provider:stub] Instruction received:', instruction);
  return {
    summary: `[STUB] Would process: "${instruction.slice(0, 80)}"`,
    operations: [],
    confidence: 0,
    provider: 'stub'
  };
}
