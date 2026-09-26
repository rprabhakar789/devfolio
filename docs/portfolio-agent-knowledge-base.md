# Portfolio Agent Knowledge Base

This document is **loaded at runtime** by `pipeline/knowledge-base.js` and injected into the
system prompt of every AI provider call (Azure OpenAI and OpenAI alike). It is the authoritative
description of the content contracts for this repository. Keep it in sync with
`scripts/validate-content.mjs` — the validator is what ultimately decides whether a change is legal.

## Editable files

Only these six files may ever be edited. Any operation targeting anything else fails the run.

| File | Format | Root shape |
| --- | --- | --- |
| `content/about.md` | Markdown | free text |
| `content/contact.yaml` | YAML | object |
| `content/experience.yaml` | YAML | array |
| `content/education.yaml` | YAML | array |
| `content/projects.yaml` | YAML | array |
| `content/skills.yaml` | YAML | array |

## Key paths

- `""` (empty string) targets the **document root**. Use it to `append` a new entry to a root array.
- Dot notation walks into objects: `links.github`.
- Array entries may be addressed by **field selector** rather than index — this is strongly
  preferred because indices shift: `[id=languages].items`, `[name=TinyUrl].summary`,
  `[company=Microsoft].highlights`.
- Numeric segments still work as indices (`0.summary`) but selectors are safer.

Never use `projects`, `skills`, `experience` or `education` as a key. These files **are** the array;
there is no wrapper object.

## Operations

- `set` — replace the value at the key path.
- `append` — add **one** entry to the array at the key path.
- `remove` — delete the value at the key path, or remove the matching entry from an array.
  For array removal the supplied `value` is matched as a **subset**: `{"name": "Rust"}` removes the
  entry whose `name` is `Rust`, regardless of its other fields.

## File contracts

### `content/skills.yaml`

A root array of **categories**, not of skills.

```yaml
- id: languages
  category: Languages
  items:
    - name: Java
      level: 95
```

- Category requires `category` and a non-empty `items` list. `id` is derived from the category name
  when omitted.
- An item is either a plain string or an object `{ name, level?, notes? }`.
- **`level` is a NUMBER from 0 to 100**, not a word. Word levels are converted automatically:
  expert → 95, advanced → 90, proficient → 85, intermediate → 80, familiar → 70, beginner → 60.
- Adding a single skill to an existing category appends to that category's `items`:

```json
{ "file": "content/skills.yaml", "op": "append", "key": "[id=languages].items", "value": { "name": "Rust", "level": 70 } }
```

- Adding a whole new category appends to the root:

```json
{ "file": "content/skills.yaml", "op": "append", "key": "", "value": { "category": "Databases", "items": [{ "name": "Postgres", "level": 85 }] } }
```

### `content/projects.yaml`

Root array. Each entry requires `name`, `summary` and a non-empty `technologies` list. Optional:
`id`, `category`, `featured` (boolean), `links` (object, typically `github` / `demo`).

```json
{ "file": "content/projects.yaml", "op": "append", "key": "", "value": { "name": "TinyUrl", "summary": "A URL shortener.", "technologies": ["Java", "Redis"], "category": "backend", "featured": false, "links": { "github": "https://github.com/…" } } }
```

Legacy field names are remapped automatically (`title`→`name`, `description`→`summary`,
`tags`/`tech`/`stack`→`technologies`, `url`→`links.github`) but prefer the correct names.

### `content/experience.yaml`

Root array. Each entry requires `company`, `role` and `period`. Optional: `id`, `location`, `logo`,
`summary`, `subtitle`, `highlight_block`, and the string lists `highlights`, `achievements`, `stack`.
`theme` is optional but when present must define all of `accent`, `accentSoft`, `surfaceFrom`,
`surfaceTo`, `border`, `glow`.

```json
{ "file": "content/experience.yaml", "op": "append", "key": "[company=Microsoft].highlights", "value": "Shipped the agentic update pipeline." }
```

### `content/education.yaml`

Root array. Each entry requires `institution`, `degree` and `period`. Same optional extras as
experience entries.

### `content/contact.yaml`

Root object. `email` is required and may never be removed. Optional `phone`, `location`, and
`links` with any of `linkedin`, `github`, `codechef`, `leetcode`, `resume`.

```json
{ "file": "content/contact.yaml", "op": "set", "key": "links.github", "value": "https://github.com/rprabhakar789" }
```

### `content/about.md`

Free Markdown text. Only whole-document keys are accepted: `""`, `markdown`, `content`, `body`,
`text`. `set` replaces the document, `append` adds a paragraph, `remove` deletes an exact paragraph
(and will refuse to empty the file).

```json
{ "file": "content/about.md", "op": "append", "key": "", "value": "I also mentor junior engineers." }
```

The token `{{experienceYears}}` is substituted at render time — preserve it if it is present.

## Failure semantics

- Operations touching any path outside the six files above fail the run immediately.
- Operations that cannot be normalised onto these contracts fail the run — they are never applied
  partially or silently dropped.
- If the provider returns a non-empty operation list but the resulting diff is empty, the run
  **fails**. A no-op is treated as a bug, not a success.

## Debugging

Set the repository variable `AI_DEBUG_RESPONSE` to `false` to silence model-output logging. It is
**on by default**, and prints the provider name, the truncated raw model message and the parsed
operations. API keys, headers and endpoint URLs are never logged.
