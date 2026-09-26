/**
 * operation-normalizer.js
 * Schema-aware normalisation that runs *before* the edit engine.
 *
 * The model often emits near-miss shapes (legacy field names, wrapper keys,
 * string skills, word levels). We repair the obvious cases deterministically and
 * fail loudly on anything that cannot be mapped onto the devfolio contracts.
 */

import { getFileContract } from './content-model.js';

/** Wrapper keys the model sometimes invents for a root-level list. */
const ROOT_ALIASES = {
  'content/projects.yaml': ['projects'],
  'content/skills.yaml': ['skills', 'categories'],
  'content/experience.yaml': ['experience', 'roles'],
  'content/education.yaml': ['education']
};

/** Legacy/sandbox field names → devfolio project fields. */
const PROJECT_FIELD_ALIASES = {
  title: 'name',
  description: 'summary',
  tags: 'technologies',
  tech: 'technologies',
  stack: 'technologies'
};

/** Word levels → devfolio's numeric skill level. */
const SKILL_LEVEL_WORDS = {
  expert: 95,
  advanced: 90,
  proficient: 85,
  intermediate: 80,
  familiar: 70,
  beginner: 60,
  novice: 55
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const trimString = (value) => (typeof value === 'string' ? value.trim() : '');
const isRootTarget = (key) => key === undefined || key === null || String(key).trim() === '';

/**
 * @param {Array<object>} operations
 * @param {{debugEnabled?: boolean}} [options]
 */
export function normalizeOperations(operations, options = {}) {
  const debugEnabled = Boolean(options.debugEnabled);
  const normalized = [];
  const notes = [];
  const errors = [];

  for (const op of operations ?? []) {
    try {
      const result = normalizeOperation(op);
      normalized.push(result.operation);
      if (debugEnabled) {
        notes.push(...result.notes.map((note) => `[${result.operation.file}] ${note}`));
      }
    } catch (error) {
      errors.push({ op, error: error.message });
    }
  }

  return { operations: normalized, notes, errors };
}

function normalizeOperation(op) {
  if (!isPlainObject(op)) {
    throw new Error('Each operation must be a plain object');
  }

  const operation = { ...op };
  const notes = [];

  operation.file = trimString(operation.file);
  const contract = getFileContract(operation.file);
  if (!contract) {
    // Path validation reports the authoritative error later.
    return { operation, notes };
  }

  if (!['set', 'append', 'remove'].includes(operation.op)) {
    throw new Error(`Unknown op type: "${operation.op}". Must be set | append | remove`);
  }

  const keyResult = normalizeKey(operation.file, operation.key);
  operation.key = keyResult.key;
  if (keyResult.note) {
    notes.push(keyResult.note);
  }

  const valueResult = normalizeValue(operation);
  operation.value = valueResult.value;
  notes.push(...valueResult.notes);

  return { operation, notes };
}

function normalizeKey(file, key) {
  if (key === undefined || key === null) {
    return { key: '' };
  }

  const trimmed = String(key).trim();
  if (!trimmed) {
    return { key: '' };
  }

  for (const alias of ROOT_ALIASES[file] ?? []) {
    if (trimmed === alias) {
      return { key: '', note: `normalized wrapper key "${alias}" to the document root` };
    }
    if (trimmed.startsWith(`${alias}.`)) {
      return {
        key: trimmed.slice(alias.length + 1),
        note: `stripped wrapper prefix "${alias}." from key "${trimmed}"`
      };
    }
  }

  return { key: trimmed };
}

function normalizeValue(operation) {
  const { file, op, key, value } = operation;
  const notes = [];

  // contact.yaml owns its own removal guard, so it runs before the generic
  // "removals need no value" shortcut below.
  if (file === 'content/contact.yaml') {
    return normalizeContactValue(value, op, key, notes);
  }

  if (op === 'remove' && value === undefined) {
    return { value, notes };
  }

  switch (file) {
    case 'content/projects.yaml':
      return normalizeListValue(value, op, key, notes, normalizeProject);
    case 'content/experience.yaml':
      return normalizeListValue(value, op, key, notes, normalizeExperience);
    case 'content/education.yaml':
      return normalizeListValue(value, op, key, notes, normalizeEducation);
    case 'content/skills.yaml':
      return normalizeSkillsValue(value, op, key, notes);
    case 'content/about.md':      return normalizeAboutValue(value, notes);
    default:
      return { value, notes };
  }
}

/**
 * Shared handling for the three "root array of entries" files.
 */
function normalizeListValue(value, op, key, notes, normalizeEntry) {
  // Removals are matched as a subset of the target entry, so a partial value
  // like { name: "TinyUrl" } is legitimate and must not be schema-checked.
  if (op === 'remove') {
    return { value, notes };
  }

  if (isRootTarget(key)) {
    if (op === 'set') {
      if (!Array.isArray(value)) {
        throw new Error('Replacing the document root requires an array value');
      }
      return { value: value.map((entry) => normalizeEntry(entry, notes)), notes };
    }
    return { value: normalizeEntry(value, notes), notes };
  }

  // Entry-level replacement, e.g. key "[name=TinyUrl]".
  if (op === 'set' && isPlainObject(value) && looksLikeWholeEntry(value)) {
    return { value: normalizeEntry(value, notes), notes };
  }

  return { value, notes };
}

function looksLikeWholeEntry(value) {
  return ['name', 'title', 'company', 'institution'].some((field) => field in value);
}

function renameAliases(entry, aliases, notes, label) {
  const result = { ...entry };
  for (const [from, to] of Object.entries(aliases)) {
    if (result[from] !== undefined && result[to] === undefined) {
      result[to] = result[from];
      delete result[from];
      notes.push(`renamed ${label} field "${from}" to "${to}"`);
    }
  }
  return result;
}

function normalizeProject(entry, notes) {
  if (typeof entry === 'string') {
    throw new Error('Project entries must be objects with name, summary and technologies');
  }
  if (!isPlainObject(entry)) {
    throw new Error('Project entries must be objects');
  }

  const project = renameAliases(entry, PROJECT_FIELD_ALIASES, notes, 'project');

  if (typeof project.url === 'string' && project.links === undefined) {
    project.links = { github: project.url };
    delete project.url;
    notes.push('moved project "url" into links.github');
  }

  project.name = trimString(project.name);
  project.summary = trimString(project.summary);

  if (!project.name || !project.summary) {
    throw new Error('Project entries require non-empty "name" and "summary" fields');
  }

  if (typeof project.technologies === 'string') {
    project.technologies = project.technologies
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    notes.push('split project technologies string into a list');
  }

  if (!Array.isArray(project.technologies) || project.technologies.length === 0) {
    throw new Error('Project entries require a non-empty "technologies" list');
  }

  if (project.technologies.some((item) => !trimString(item))) {
    throw new Error('Project technologies must all be non-empty strings');
  }

  if (project.featured !== undefined && typeof project.featured !== 'boolean') {
    throw new Error('Project "featured" must be a boolean when provided');
  }

  if (project.links !== undefined && !isPlainObject(project.links)) {
    throw new Error('Project "links" must be an object when provided');
  }

  if (!project.category) {
    project.category = 'general';
    notes.push('defaulted project category to "general"');
  }

  return project;
}

function normalizeExperience(entry, notes) {
  if (!isPlainObject(entry)) {
    throw new Error('Experience entries must be objects');
  }

  const role = renameAliases(entry, { title: 'role', organisation: 'company', organization: 'company' }, notes, 'experience');

  role.company = trimString(role.company);
  role.role = trimString(role.role);
  role.period = trimString(role.period);

  if (!role.company || !role.role || !role.period) {
    throw new Error('Experience entries require non-empty "company", "role" and "period" fields');
  }

  for (const field of ['highlights', 'achievements', 'stack']) {
    if (role[field] === undefined) {
      continue;
    }
    if (!Array.isArray(role[field]) || role[field].some((item) => !trimString(item))) {
      throw new Error(`Experience "${field}" must be a list of non-empty strings`);
    }
  }

  return role;
}

function normalizeEducation(entry, notes) {
  if (!isPlainObject(entry)) {
    throw new Error('Education entries must be objects');
  }

  const education = renameAliases(entry, { school: 'institution', college: 'institution' }, notes, 'education');

  education.institution = trimString(education.institution);
  education.degree = trimString(education.degree);
  education.period = trimString(education.period);

  if (!education.institution || !education.degree || !education.period) {
    throw new Error('Education entries require non-empty "institution", "degree" and "period" fields');
  }

  return education;
}

function normalizeSkillsValue(value, op, key, notes) {
  const targetsCategoryItems = /(^|\.)items$/.test(String(key ?? '').trim());

  // Removing a skill by name is normalised (so "Rust" matches { name: Rust }),
  // but removing a whole category is matched as a subset and passes through.
  if (op === 'remove') {
    return targetsCategoryItems ? { value: normalizeSkillItem(value, notes), notes } : { value, notes };
  }

  if (isRootTarget(key)) {
    if (op === 'set') {
      if (!Array.isArray(value)) {
        throw new Error('Replacing skills.yaml requires an array of categories');
      }
      return { value: value.map((entry) => normalizeSkillCategory(entry, notes)), notes };
    }
    return { value: normalizeSkillCategory(value, notes), notes };
  }

  if (targetsCategoryItems) {
    if (op === 'set') {
      if (!Array.isArray(value)) {
        throw new Error('Replacing a category\'s items requires an array value');
      }
      return { value: value.map((item) => normalizeSkillItem(item, notes)), notes };
    }
    return { value: normalizeSkillItem(value, notes), notes };
  }

  return { value, notes };
}

function normalizeSkillCategory(entry, notes) {
  if (!isPlainObject(entry)) {
    throw new Error('Skill categories must be objects with "category" and "items"');
  }

  const category = { ...entry };
  category.category = trimString(category.category ?? category.name);
  if (category.name !== undefined && category.category) {
    delete category.name;
  }

  if (!category.category) {
    throw new Error('Skill categories require a non-empty "category" field');
  }

  if (!category.id) {
    category.id = category.category.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    notes.push(`derived skills category id "${category.id}"`);
  }

  if (!Array.isArray(category.items) || category.items.length === 0) {
    throw new Error('Skill categories require a non-empty "items" list');
  }

  category.items = category.items.map((item) => normalizeSkillItem(item, notes));
  return category;
}

function normalizeSkillItem(value, notes) {
  if (typeof value === 'string') {
    const parsed = parseSkillString(value);
    notes.push(`normalized skill string "${value}" to ${JSON.stringify(parsed)}`);
    return parsed;
  }

  if (!isPlainObject(value)) {
    throw new Error('Skill items must be objects or strings');
  }

  const item = { ...value };
  item.name = trimString(item.name);
  if (!item.name) {
    throw new Error('Skill items require a non-empty "name" field');
  }

  if (item.level === undefined || item.level === null || item.level === '') {
    delete item.level;
    return item;
  }

  const level = coerceSkillLevel(item.level);
  if (level === null) {
    throw new Error(`Skill "${item.name}" has an unsupported level "${item.level}" (use a number 0-100)`);
  }

  if (level !== item.level) {
    notes.push(`converted skill level "${item.level}" to ${level} for "${item.name}"`);
  }

  item.level = level;

  if (item.notes !== undefined && !trimString(item.notes)) {
    throw new Error(`Skill "${item.name}" has an empty "notes" value`);
  }

  return item;
}

function parseSkillString(value) {
  const trimmed = trimString(value);
  if (!trimmed) {
    throw new Error('Skill strings must be non-empty');
  }

  const match = trimmed.match(/^(.*?)\s*\(([^()]+)\)$/);
  if (!match) {
    return { name: trimmed };
  }

  const name = trimString(match[1]);
  const level = coerceSkillLevel(match[2]);

  if (!name) {
    throw new Error(`Cannot read a skill name from "${value}"`);
  }

  return level === null ? { name } : { name, level };
}

function coerceSkillLevel(input) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return clampLevel(input);
  }

  const text = trimString(input).toLowerCase();
  if (!text) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(text)) {
    return clampLevel(Number(text));
  }

  return SKILL_LEVEL_WORDS[text] ?? null;
}

function clampLevel(level) {
  return Math.min(100, Math.max(0, Math.round(level)));
}

function normalizeContactValue(value, op, key, notes) {
  const target = String(key ?? '').trim();

  if (op === 'remove' && (target === 'email' || target === '')) {
    throw new Error('Refusing to remove the contact email');
  }

  if (op === 'remove') {
    return { value, notes };
  }

  if (isRootTarget(key)) {
    if (op !== 'set' || !isPlainObject(value)) {
      throw new Error('contact.yaml root edits require a "set" with an object value');
    }
    if (!trimString(value.email)) {
      throw new Error('contact.yaml requires a non-empty "email"');
    }
    return { value, notes };
  }

  if (target === 'links') {
    if (!isPlainObject(value)) {
      throw new Error('contact.yaml "links" must be an object');
    }
    return { value, notes };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new Error(`contact.yaml "${target}" must be a non-empty string`);
    }
    if (trimmed !== value) {
      notes.push(`trimmed contact value for "${target}"`);
    }
    return { value: trimmed, notes };
  }

  return { value, notes };
}

function normalizeAboutValue(value, notes) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('about.md edits require a non-empty string value');
  }
  if (value !== value.trim()) {
    notes.push('trimmed about.md markdown value');
  }
  return { value: value.trim(), notes };
}
