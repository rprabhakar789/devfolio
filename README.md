# Devfolio - Interactive Portfolio

An interactive portfolio built with React, Framer Motion, and Vite.

## Quick Start

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Content Management (automation-compatible)

Portfolio content is now file-driven under top-level `content/` and loaded by `src/content/loadContent.js`.

The following files are the automation contract for `portfolio-management-agent`:

- `content/about.md`
- `content/experience.yaml`
- `content/projects.yaml`
- `content/education.yaml`
- `content/skills.yaml`
- `content/contact.yaml`

Update these files to change portfolio content without touching React components.

## Content Schemas

### `content/about.md`
- Markdown prose for the About section.
- Supports `{{experienceYears}}` placeholder (computed from Oct 2020 rule).

### `content/experience.yaml`
- Root: list of roles.
- Required fields per role:
  - `company` (string)
  - `role` (string)
  - `period` (string)
- Optional:
  - `id`, `location`, `summary`, `engagement`, `logo`
  - `highlights` (string[])
  - `theme` object for card styling (`accent`, `accentSoft`, `surfaceFrom`, `surfaceTo`, `border`, `glow`)

### `content/projects.yaml`
- Root: list of projects.
- Required fields per project:
  - `name` (string)
  - `summary` (string)
  - `technologies` (string[])
- Optional:
  - `category` (string)
  - `featured` (boolean)
  - `links` object (e.g. `github`, `demo`)

### `content/education.yaml`
- Root: list of education entries.
- Required fields per entry:
  - `institution` (string)
  - `degree` (string)
  - `period` (string)
- Optional:
  - `location` (string)
  - `highlights` (string[])

### `content/skills.yaml`
- Root: list of skill categories.
- Required fields per category:
  - `category` (string)
  - `items` (list)
- Optional:
  - `id` (string)
- `items` may be:
  - strings, or
  - objects with `name` (required), `level` (number, optional), `notes` (string, optional)

### `content/contact.yaml`
- Root: object.
- Required:
  - `email` (string)
- Optional:
  - `phone` (string)
  - `location` (string)
  - `links` object (key/value URLs such as `linkedin`, `github`, `resume`)

## Validation and failure behavior

`src/content/loadContent.js` centrally parses and validates all content files using:

- `yaml` for YAML parsing
- `react-markdown` (`remark-gfm`, `remark-breaks`) for safe markdown rendering

Malformed or missing required fields throw explicit errors with file/field context (for example: `[content/experience.yaml] role[1].company must be a non-empty string`) so problems fail clearly in dev/build.

## Manual editing guidance

1. Keep required fields present and correctly typed.
2. Preserve list/object roots exactly as documented above.
3. Prefer editing only `content/*` for portfolio updates.
4. Run `npm run lint && npm run build` before pushing changes.

## Tech Stack

- React 19
- Framer Motion
- Vite
- React Icons
- React Markdown + remark plugins
- YAML parser (`yaml`)

## Author

Rahul Prabhakar - [@rprabhakar789](https://github.com/rprabhakar789)
