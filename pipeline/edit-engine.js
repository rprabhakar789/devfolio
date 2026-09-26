/**
 * edit-engine.js
 * Deterministic layer that applies structured edit operations to devfolio content.
 *
 * An edit operation looks like:
 *   { file: 'content/skills.yaml', op: 'append', key: '[id=languages].items', value: { name: 'Rust' } }
 *
 * Supported ops:
 *   set    - replace the value at key (or the whole document when key is empty)
 *   append - push a value onto the sequence at key (or the root sequence)
 *   remove - delete a key, or drop a matching entry from a sequence
 *
 * Key paths use dot notation and may contain selectors so the model never has to
 * guess array indices:
 *   'email'                      → contact.yaml email
 *   'links.github'               → nested object key
 *   '[name=TinyUrl]'             → the projects.yaml entry whose name is TinyUrl
 *   '[id=languages].items'       → the items of the "languages" skills category
 *   ''                           → the document root
 *
 * YAML is edited through the yaml Document API so comments, ordering and
 * formatting of untouched content are preserved.
 */

import fs from 'node:fs';
import process from 'node:process';

import YAML from 'yaml';

import { getFileContract } from './content-model.js';
import { validatePath } from './path-validator.js';

const YAML_STRINGIFY_OPTIONS = { lineWidth: 0 };
const MARKDOWN_BODY_KEYS = new Set(['', 'markdown', 'content', 'body', 'text']);

/**
 * Splits a key path into segments, honouring [field=value] selectors.
 * @param {string} key
 * @returns {Array<{type: 'key'|'index'|'selector', value: string, field?: string}>}
 */
export function parseKeyPath(key) {
  if (key === undefined || key === null) {
    return [];
  }

  const raw = String(key).trim();
  if (!raw) {
    return [];
  }

  const segments = [];
  let buffer = '';

  const pushBuffer = () => {
    const trimmed = buffer.trim();
    buffer = '';
    if (!trimmed) {
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      segments.push({ type: 'index', value: trimmed });
    } else {
      segments.push({ type: 'key', value: trimmed });
    }
  };

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (char === '[') {
      pushBuffer();
      const end = raw.indexOf(']', i);
      if (end === -1) {
        throw new Error(`Unterminated selector in key path "${key}"`);
      }
      const selector = raw.slice(i + 1, end);
      const equals = selector.indexOf('=');
      if (equals === -1) {
        throw new Error(`Selector "[${selector}]" must use the form [field=value]`);
      }
      segments.push({
        type: 'selector',
        field: selector.slice(0, equals).trim(),
        value: selector.slice(equals + 1).trim()
      });
      i = end;
      continue;
    }

    if (char === '.') {
      pushBuffer();
      continue;
    }

    buffer += char;
  }

  pushBuffer();
  return segments;
}

function scalarText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function nodeAt(doc, resolvedPath) {
  if (resolvedPath.length === 0) {
    return doc.contents;
  }
  return doc.getIn(resolvedPath, true);
}

/**
 * Resolves parsed segments into a concrete yaml path (selectors become indices).
 */
function resolvePath(doc, segments, key) {
  const resolved = [];

  for (const segment of segments) {
    if (segment.type === 'selector') {
      const parent = nodeAt(doc, resolved);
      if (!YAML.isSeq(parent)) {
        throw new Error(`Selector [${segment.field}=${segment.value}] in "${key}" requires a list`);
      }

      const index = parent.items.findIndex((item) => {
        const plain = YAML.isNode(item) ? item.toJSON() : item;
        if (!plain || typeof plain !== 'object') {
          return false;
        }
        return scalarText(plain[segment.field]) === scalarText(segment.value);
      });

      if (index === -1) {
        throw new Error(`No entry matching [${segment.field}=${segment.value}] in "${key}"`);
      }

      resolved.push(index);
      continue;
    }

    resolved.push(segment.type === 'index' ? Number(segment.value) : segment.value);
  }

  return resolved;
}

/**
 * Subset match so removals can target an entry by its identifying fields only.
 */
function matchesValue(candidate, value) {
  if (value === undefined) {
    return false;
  }

  const isObject = (input) => Boolean(input) && typeof input === 'object' && !Array.isArray(input);

  if (isObject(candidate) && isObject(value)) {
    return Object.entries(value).every(
      ([field, expected]) => JSON.stringify(candidate[field]) === JSON.stringify(expected)
    );
  }

  if (typeof candidate === 'string' && typeof value === 'string') {
    return scalarText(candidate) === scalarText(value);
  }

  return JSON.stringify(candidate) === JSON.stringify(value);
}

/**
 * Applies one operation to a parsed YAML document (mutates in place).
 */
export function applyYamlOp(doc, op) {
  const { op: opType, key, value } = op;
  const segments = parseKeyPath(key);
  const targetPath = resolvePath(doc, segments, key ?? '');

  switch (opType) {
    case 'set': {
      if (targetPath.length === 0) {
        doc.contents = doc.createNode(value);
        return doc;
      }
      doc.setIn(targetPath, value);
      return doc;
    }

    case 'append': {
      const target = nodeAt(doc, targetPath);

      if (target === undefined || target === null) {
        if (targetPath.length === 0) {
          throw new Error('Cannot append to an empty document root');
        }
        doc.setIn(targetPath, [value]);
        return doc;
      }

      if (!YAML.isSeq(target)) {
        throw new Error(`Cannot append to "${key ?? ''}" because it is not a list`);
      }

      target.add(doc.createNode(value));
      return doc;
    }

    case 'remove': {
      const target = nodeAt(doc, targetPath);

      if (YAML.isSeq(target) && value !== undefined) {
        const index = target.items.findIndex((item) =>
          matchesValue(YAML.isNode(item) ? item.toJSON() : item, value)
        );
        if (index === -1) {
          throw new Error(`No list entry in "${key ?? ''}" matches the requested removal`);
        }
        doc.deleteIn([...targetPath, index]);
        return doc;
      }

      if (targetPath.length === 0) {
        throw new Error('Refusing to delete the entire document root');
      }

      if (!doc.hasIn(targetPath)) {
        throw new Error(`Nothing to remove at "${key ?? ''}"`);
      }

      doc.deleteIn(targetPath);
      return doc;
    }

    default:
      throw new Error(`Unknown op type: "${opType}". Must be set | append | remove`);
  }
}

/**
 * Applies one operation to markdown source, returning the new source.
 */
export function applyMarkdownOp(source, op) {
  const { op: opType, key, value } = op;
  const normalizedKey = String(key ?? '').trim().toLowerCase();

  if (!MARKDOWN_BODY_KEYS.has(normalizedKey)) {
    throw new Error(`Markdown files only support whole-document edits, got key "${key}"`);
  }

  const current = source.trim();

  switch (opType) {
    case 'set': {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('Markdown set operations require a non-empty string value');
      }
      return `${value.trim()}\n`;
    }

    case 'append': {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('Markdown append operations require a non-empty string value');
      }
      return `${[current, value.trim()].filter(Boolean).join('\n\n')}\n`;
    }

    case 'remove': {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('Markdown remove operations require the paragraph text to remove');
      }
      const paragraphs = current.split(/\n{2,}/);
      const index = paragraphs.findIndex((paragraph) => scalarText(paragraph) === scalarText(value));
      if (index === -1) {
        throw new Error('No markdown paragraph matches the requested removal');
      }
      paragraphs.splice(index, 1);
      if (paragraphs.length === 0) {
        throw new Error('Refusing to empty content/about.md');
      }
      return `${paragraphs.join('\n\n')}\n`;
    }

    default:
      throw new Error(`Unknown op type: "${opType}". Must be set | append | remove`);
  }
}

/**
 * Applies edit operations and writes changed files to disk.
 * @param {Array<{file: string, op: string, key?: string, value?: unknown}>} operations
 * @param {string} [rootDir]
 * @returns {{applied: number, errors: Array<{op: object, error: string}>, changedFiles: string[]}}
 */
export function applyEdits(operations, rootDir = process.cwd()) {
  if (!Array.isArray(operations) || operations.length === 0) {
    return { applied: 0, errors: [], changedFiles: [] };
  }

  const byFile = new Map();
  for (const op of operations) {
    if (!byFile.has(op.file)) {
      byFile.set(op.file, []);
    }
    byFile.get(op.file).push(op);
  }

  let applied = 0;
  const errors = [];
  const changedFiles = [];

  for (const [file, ops] of byFile) {
    let absolutePath;
    try {
      absolutePath = validatePath(file, rootDir);
    } catch (error) {
      for (const op of ops) {
        errors.push({ op, error: error.message });
      }
      continue;
    }

    const contract = getFileContract(file);
    let originalRaw;
    try {
      originalRaw = fs.readFileSync(absolutePath, 'utf8');
    } catch (error) {
      for (const op of ops) {
        errors.push({ op, error: `Cannot read ${file}: ${error.message}` });
      }
      continue;
    }

    let serialized = originalRaw;

    if (contract.format === 'markdown') {
      for (const op of ops) {
        try {
          serialized = applyMarkdownOp(serialized, op);
          applied += 1;
        } catch (error) {
          errors.push({ op, error: error.message });
        }
      }
    } else {
      let doc;
      try {
        doc = YAML.parseDocument(originalRaw);
        if (doc.errors.length > 0) {
          throw new Error(doc.errors[0].message);
        }
      } catch (error) {
        for (const op of ops) {
          errors.push({ op, error: `Cannot parse ${file}: ${error.message}` });
        }
        continue;
      }

      for (const op of ops) {
        try {
          applyYamlOp(doc, op);
          applied += 1;
        } catch (error) {
          errors.push({ op, error: error.message });
        }
      }

      serialized = doc.toString(YAML_STRINGIFY_OPTIONS);
    }

    if (serialized === originalRaw) {
      continue;
    }

    try {
      fs.writeFileSync(absolutePath, serialized, 'utf8');
      changedFiles.push(file);
    } catch (error) {
      for (const op of ops) {
        errors.push({ op, error: `Failed to write ${file}: ${error.message}` });
      }
      applied -= ops.length;
    }
  }

  return { applied, errors, changedFiles };
}
