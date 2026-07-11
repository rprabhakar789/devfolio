import YAML from 'yaml';

import aboutMarkdownRaw from '../../content/about.md?raw';
import contactYamlRaw from '../../content/contact.yaml?raw';
import educationYamlRaw from '../../content/education.yaml?raw';
import experienceYamlRaw from '../../content/experience.yaml?raw';
import projectsYamlRaw from '../../content/projects.yaml?raw';
import skillsYamlRaw from '../../content/skills.yaml?raw';

const EXPERIENCE_START_DATE = new Date(2020, 9, 1);
const REQUIRED_THEME_FIELDS = ['accent', 'accentSoft', 'surfaceFrom', 'surfaceTo', 'border', 'glow'];

function contentError(file, message) {
  throw new Error(`[content/${file}] ${message}`);
}

function parseYaml(file, source) {
  try {
    return YAML.parse(source);
  } catch (error) {
    contentError(file, `invalid YAML: ${error.message}`);
  }
}

function assertObject(value, file, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    contentError(file, `${field} must be an object`);
  }
}

function assertString(value, file, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    contentError(file, `${field} must be a non-empty string`);
  }
}

function assertArray(value, file, field) {
  if (!Array.isArray(value)) {
    contentError(file, `${field} must be an array`);
  }
}

function normalizeAssetUrl(value) {
  if (!value) {
    return '';
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const base = import.meta.env.BASE_URL ?? '/';
  return `${base}${value.replace(/^\/+/, '')}`;
}

function normalizeLinkLabel(key) {
  if (key === 'github') {
    return 'GitHub';
  }
  if (key === 'linkedin') {
    return 'LinkedIn';
  }
  if (key === 'resume') {
    return 'Resume';
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function getExperienceYears(now = new Date()) {
  if (now < EXPERIENCE_START_DATE) {
    return 0;
  }

  let fullYears = now.getFullYear() - EXPERIENCE_START_DATE.getFullYear();
  const hasReachedAnniversary =
    now.getMonth() > EXPERIENCE_START_DATE.getMonth() ||
    (now.getMonth() === EXPERIENCE_START_DATE.getMonth() && now.getDate() >= EXPERIENCE_START_DATE.getDate());

  if (!hasReachedAnniversary) {
    fullYears -= 1;
  }

  const lastAnniversaryYear = hasReachedAnniversary ? now.getFullYear() : now.getFullYear() - 1;
  const lastAnniversary = new Date(lastAnniversaryYear, EXPERIENCE_START_DATE.getMonth(), EXPERIENCE_START_DATE.getDate());
  const nextAnniversary = new Date(lastAnniversaryYear + 1, EXPERIENCE_START_DATE.getMonth(), EXPERIENCE_START_DATE.getDate());
  const fractionalRemainder = (now - lastAnniversary) / (nextAnniversary - lastAnniversary);

  return fractionalRemainder > 0.5 ? fullYears + 1 : fullYears;
}

function loadAbout() {
  const markdown = aboutMarkdownRaw.trim();
  if (!markdown) {
    contentError('about.md', 'markdown content cannot be empty');
  }
  return {
    markdown: markdown.replace(/{{\s*experienceYears\s*}}/g, String(getExperienceYears()))
  };
}

function loadExperience() {
  const parsed = parseYaml('experience.yaml', experienceYamlRaw);
  assertArray(parsed, 'experience.yaml', 'root');

  return parsed.map((item, index) => {
    const entryField = `role[${index}]`;
    assertObject(item, 'experience.yaml', entryField);
    assertString(item.company, 'experience.yaml', `${entryField}.company`);
    assertString(item.role, 'experience.yaml', `${entryField}.role`);
    assertString(item.period, 'experience.yaml', `${entryField}.period`);

    if (item.location !== undefined) {
      assertString(item.location, 'experience.yaml', `${entryField}.location`);
    }
    if (item.summary !== undefined) {
      assertString(item.summary, 'experience.yaml', `${entryField}.summary`);
    }
    if (item.highlights !== undefined) {
      assertArray(item.highlights, 'experience.yaml', `${entryField}.highlights`);
      item.highlights.forEach((highlight, hIndex) => {
        assertString(highlight, 'experience.yaml', `${entryField}.highlights[${hIndex}]`);
      });
    }
    if (item.theme !== undefined) {
      assertObject(item.theme, 'experience.yaml', `${entryField}.theme`);
      REQUIRED_THEME_FIELDS.forEach((field) => {
        assertString(item.theme[field], 'experience.yaml', `${entryField}.theme.${field}`);
      });
    }

    return {
      id: item.id || `${item.company}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      company: item.company,
      role: item.role,
      period: item.period,
      location: item.location ?? '',
      summary: item.summary ?? '',
      engagement: item.engagement ?? '',
      logo: item.logo ?? '',
      theme: item.theme ?? null,
      highlights: item.highlights ?? []
    };
  });
}

function loadProjects() {
  const parsed = parseYaml('projects.yaml', projectsYamlRaw);
  assertArray(parsed, 'projects.yaml', 'root');

  return parsed.map((item, index) => {
    const entryField = `project[${index}]`;
    assertObject(item, 'projects.yaml', entryField);
    assertString(item.name, 'projects.yaml', `${entryField}.name`);
    assertString(item.summary, 'projects.yaml', `${entryField}.summary`);
    assertArray(item.technologies, 'projects.yaml', `${entryField}.technologies`);
    item.technologies.forEach((technology, tIndex) => {
      assertString(technology, 'projects.yaml', `${entryField}.technologies[${tIndex}]`);
    });

    if (item.links !== undefined) {
      assertObject(item.links, 'projects.yaml', `${entryField}.links`);
      Object.entries(item.links).forEach(([key, value]) => {
        assertString(value, 'projects.yaml', `${entryField}.links.${key}`);
      });
    }
    if (item.featured !== undefined && typeof item.featured !== 'boolean') {
      contentError('projects.yaml', `${entryField}.featured must be a boolean when provided`);
    }

    return {
      id: item.id || `${item.name}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: item.name,
      summary: item.summary,
      technologies: item.technologies,
      category: item.category || 'general',
      featured: item.featured ?? false,
      links: item.links ?? {}
    };
  });
}

function loadEducation() {
  const parsed = parseYaml('education.yaml', educationYamlRaw);
  assertArray(parsed, 'education.yaml', 'root');

  return parsed.map((item, index) => {
    const entryField = `education[${index}]`;
    assertObject(item, 'education.yaml', entryField);
    assertString(item.institution, 'education.yaml', `${entryField}.institution`);
    assertString(item.degree, 'education.yaml', `${entryField}.degree`);
    assertString(item.period, 'education.yaml', `${entryField}.period`);
    if (item.location !== undefined) {
      assertString(item.location, 'education.yaml', `${entryField}.location`);
    }
    if (item.highlights !== undefined) {
      assertArray(item.highlights, 'education.yaml', `${entryField}.highlights`);
      item.highlights.forEach((highlight, hIndex) => {
        assertString(highlight, 'education.yaml', `${entryField}.highlights[${hIndex}]`);
      });
    }

    return {
      institution: item.institution,
      degree: item.degree,
      period: item.period,
      location: item.location ?? '',
      highlights: item.highlights ?? []
    };
  });
}

function loadSkills() {
  const parsed = parseYaml('skills.yaml', skillsYamlRaw);
  assertArray(parsed, 'skills.yaml', 'root');

  return parsed.map((category, index) => {
    const categoryField = `category[${index}]`;
    assertObject(category, 'skills.yaml', categoryField);
    assertString(category.category, 'skills.yaml', `${categoryField}.category`);
    assertArray(category.items, 'skills.yaml', `${categoryField}.items`);

    const normalizedItems = category.items.map((item, itemIndex) => {
      const itemField = `${categoryField}.items[${itemIndex}]`;
      if (typeof item === 'string') {
        return { name: item };
      }
      assertObject(item, 'skills.yaml', itemField);
      assertString(item.name, 'skills.yaml', `${itemField}.name`);
      if (item.level !== undefined && (typeof item.level !== 'number' || Number.isNaN(item.level))) {
        contentError('skills.yaml', `${itemField}.level must be a number when provided`);
      }
      if (item.notes !== undefined) {
        assertString(item.notes, 'skills.yaml', `${itemField}.notes`);
      }

      return {
        name: item.name,
        level: item.level,
        notes: item.notes
      };
    });

    return {
      id: category.id || category.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: category.category,
      items: normalizedItems
    };
  });
}

function loadContact() {
  const parsed = parseYaml('contact.yaml', contactYamlRaw);
  assertObject(parsed, 'contact.yaml', 'root');
  assertString(parsed.email, 'contact.yaml', 'email');

  if (parsed.phone !== undefined) {
    assertString(parsed.phone, 'contact.yaml', 'phone');
  }
  if (parsed.location !== undefined) {
    assertString(parsed.location, 'contact.yaml', 'location');
  }
  if (parsed.links !== undefined) {
    assertObject(parsed.links, 'contact.yaml', 'links');
  }

  const links = Object.entries(parsed.links || {}).map(([key, value]) => {
    assertString(value, 'contact.yaml', `links.${key}`);

    return {
      key,
      label: normalizeLinkLabel(key),
      href: key === 'resume' ? normalizeAssetUrl(value) : value,
      value:
        key === 'linkedin'
          ? value.replace(/^https?:\/\//, '')
          : key === 'github'
            ? value.replace(/^https?:\/\//, '')
            : key === 'resume'
              ? 'View or download PDF'
              : value
    };
  });

  return {
    email: parsed.email,
    phone: parsed.phone ?? '',
    location: parsed.location ?? '',
    links
  };
}

function normalizeCategoryLabel(id) {
  const knownLabels = {
    all: 'All',
    backend: 'Backend',
    fullstack: 'Full Stack',
    'system-design': 'System Design',
    tools: 'Tools'
  };

  if (knownLabels[id]) {
    return knownLabels[id];
  }
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildProjectCategories(projects) {
  const uniqueCategories = Array.from(new Set(projects.map((project) => project.category)));
  return [{ id: 'all', label: 'All' }, ...uniqueCategories.map((id) => ({ id, label: normalizeCategoryLabel(id) }))];
}

function buildAboutStats(experience, projects, skills) {
  return [
    { label: 'Years Experience', value: getExperienceYears() },
    { label: 'Career Roles', value: `${experience.length}` },
    { label: 'Projects Showcased', value: `${projects.length}` },
    { label: 'Skill Areas', value: `${skills.length}` }
  ];
}

const about = loadAbout();
const experience = loadExperience();
const projects = loadProjects();
const education = loadEducation();
const skills = loadSkills();
const contact = loadContact();

export const portfolioContent = {
  about,
  experience,
  projects,
  education,
  skills,
  contact,
  projectCategories: buildProjectCategories(projects),
  aboutStats: buildAboutStats(experience, projects, skills),
  resumeUrl: contact.links.find((link) => link.key === 'resume')?.href ?? ''
};
