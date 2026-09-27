/**
 * Self-contained content fixtures.
 *
 * Tests must never mutate copies of the live content/ directory: the agent
 * edits those files, so any real content change would break CI. These fixtures
 * are fixed inputs that exercise the same shapes as the real files.
 */

export const SKILLS_YAML = `- id: languages
  category: Languages
  items:
    - name: Java
      level: 95
    - name: SQL
      level: 92

- id: frameworks
  category: Frameworks
  items:
    - name: Spring Boot
      level: 95
`;

export const PROJECTS_YAML = `- name: TinyUrl
  summary: A URL shortener.
  technologies:
    - Java
    - Redis
  category: backend
  featured: false
  links:
    github: https://github.com/example/tinyurl
`;

export const EXPERIENCE_YAML = `- id: microsoft
  company: Microsoft
  role: Software Engineer II
  period: May 2025 - Current
  highlights:
    - Shipped a thing.
`;

export const EDUCATION_YAML = `- institution: Example University
  degree: B.Tech, Computer Science
  period: 2016 - 2020
`;

export const CONTACT_YAML = `email: someone@example.com
location: Hyderabad, India
links:
  linkedin: https://linkedin.com/in/example
  github: https://github.com/example
`;

export const ABOUT_MD = `I build backend systems.

I also work on agentic automation.
`;

export const CONTENT_FIXTURES = {
  'content/skills.yaml': SKILLS_YAML,
  'content/projects.yaml': PROJECTS_YAML,
  'content/experience.yaml': EXPERIENCE_YAML,
  'content/education.yaml': EDUCATION_YAML,
  'content/contact.yaml': CONTACT_YAML,
  'content/about.md': ABOUT_MD
};
