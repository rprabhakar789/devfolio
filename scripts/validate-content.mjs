import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import YAML from 'yaml';

const rootDir = process.cwd();
const contentDir = resolve(rootDir, 'content');

function fail(file, message) {
  throw new Error(`[content/${file}] ${message}`);
}

function assertString(value, file, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(file, `${field} must be a non-empty string`);
  }
}

function assertArray(value, file, field) {
  if (!Array.isArray(value)) {
    fail(file, `${field} must be an array`);
  }
}

function assertObject(value, file, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(file, `${field} must be an object`);
  }
}

async function readText(file) {
  return readFile(resolve(contentDir, file), 'utf8');
}

async function readYaml(file) {
  const source = await readText(file);
  try {
    return YAML.parse(source);
  } catch (error) {
    fail(file, `invalid YAML: ${error.message}`);
  }
}

async function validateAbout() {
  const markdown = (await readText('about.md')).trim();
  if (!markdown) {
    fail('about.md', 'markdown content cannot be empty');
  }
}

function validateExperience(data) {
  assertArray(data, 'experience.yaml', 'root');
  data.forEach((item, index) => {
    const field = `role[${index}]`;
    assertObject(item, 'experience.yaml', field);
    assertString(item.company, 'experience.yaml', `${field}.company`);
    assertString(item.role, 'experience.yaml', `${field}.role`);
    assertString(item.period, 'experience.yaml', `${field}.period`);
    if (item.highlights !== undefined) {
      assertArray(item.highlights, 'experience.yaml', `${field}.highlights`);
      item.highlights.forEach((highlight, highlightIndex) => {
        assertString(highlight, 'experience.yaml', `${field}.highlights[${highlightIndex}]`);
      });
    }
  });
}

function validateProjects(data) {
  assertArray(data, 'projects.yaml', 'root');
  data.forEach((item, index) => {
    const field = `project[${index}]`;
    assertObject(item, 'projects.yaml', field);
    assertString(item.name, 'projects.yaml', `${field}.name`);
    assertString(item.summary, 'projects.yaml', `${field}.summary`);
    assertArray(item.technologies, 'projects.yaml', `${field}.technologies`);
    item.technologies.forEach((tech, techIndex) => {
      assertString(tech, 'projects.yaml', `${field}.technologies[${techIndex}]`);
    });
    if (item.featured !== undefined && typeof item.featured !== 'boolean') {
      fail('projects.yaml', `${field}.featured must be a boolean when provided`);
    }
    if (item.links !== undefined) {
      assertObject(item.links, 'projects.yaml', `${field}.links`);
    }
  });
}

function validateEducation(data) {
  assertArray(data, 'education.yaml', 'root');
  data.forEach((item, index) => {
    const field = `education[${index}]`;
    assertObject(item, 'education.yaml', field);
    assertString(item.institution, 'education.yaml', `${field}.institution`);
    assertString(item.degree, 'education.yaml', `${field}.degree`);
    assertString(item.period, 'education.yaml', `${field}.period`);
    if (item.highlights !== undefined) {
      assertArray(item.highlights, 'education.yaml', `${field}.highlights`);
      item.highlights.forEach((highlight, highlightIndex) => {
        assertString(highlight, 'education.yaml', `${field}.highlights[${highlightIndex}]`);
      });
    }
  });
}

function validateSkills(data) {
  assertArray(data, 'skills.yaml', 'root');
  data.forEach((category, index) => {
    const field = `category[${index}]`;
    assertObject(category, 'skills.yaml', field);
    assertString(category.category, 'skills.yaml', `${field}.category`);
    assertArray(category.items, 'skills.yaml', `${field}.items`);
    category.items.forEach((item, itemIndex) => {
      const itemField = `${field}.items[${itemIndex}]`;
      if (typeof item === 'string') {
        assertString(item, 'skills.yaml', itemField);
        return;
      }
      assertObject(item, 'skills.yaml', itemField);
      assertString(item.name, 'skills.yaml', `${itemField}.name`);
      if (item.level !== undefined && (typeof item.level !== 'number' || Number.isNaN(item.level))) {
        fail('skills.yaml', `${itemField}.level must be a number when provided`);
      }
      if (item.notes !== undefined) {
        assertString(item.notes, 'skills.yaml', `${itemField}.notes`);
      }
    });
  });
}

function validateContact(data) {
  assertObject(data, 'contact.yaml', 'root');
  assertString(data.email, 'contact.yaml', 'email');
  if (data.phone !== undefined) {
    assertString(data.phone, 'contact.yaml', 'phone');
  }
  if (data.location !== undefined) {
    assertString(data.location, 'contact.yaml', 'location');
  }
  if (data.links !== undefined) {
    assertObject(data.links, 'contact.yaml', 'links');
    Object.entries(data.links).forEach(([key, value]) => {
      assertString(value, 'contact.yaml', `links.${key}`);
    });
  }
}

async function run() {
  await validateAbout();
  validateExperience(await readYaml('experience.yaml'));
  validateProjects(await readYaml('projects.yaml'));
  validateEducation(await readYaml('education.yaml'));
  validateSkills(await readYaml('skills.yaml'));
  validateContact(await readYaml('contact.yaml'));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
