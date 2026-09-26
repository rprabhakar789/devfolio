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

The following files are the automation contract for the built-in [portfolio agent](#portfolio-agent):

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

## Portfolio Agent

An in-repo automation pipeline that turns a free-text instruction (typically an email) into a
pull request that edits **only** the files under `content/`.

```
Gmail (labeled) → Apps Script → repository_dispatch
      → .github/workflows/portfolio-agent.yml
          → pipeline/agent.js
              → ai-provider (Azure OpenAI → OpenAI → stub)
              → operation-normalizer (schema repair)
              → path-validator (content/ only)
              → edit-engine (YAML/Markdown aware)
          → npm run validate:content && npm run build
          → pull request (auto-merged on explicit intent)
      → Deploy to GitHub Pages
```

GitHub Actions orchestrates; the AI call happens only inside `pipeline/ai-provider.js`.

### Running it locally

```bash
npm ci
npm test                                             # pipeline unit tests
node pipeline/agent.js --instruction "Add Rust at intermediate level to my languages"
```

With no AI credentials set the provider falls back to a stub that makes no changes. You can also
drive the deterministic layer directly, bypassing the model:

```bash
node pipeline/agent.js --json '{"operations":[{"file":"content/skills.yaml","op":"append","key":"[id=languages].items","value":{"name":"Rust","level":70}}]}'
```

### Configuration

Recommended split — the key is a secret, everything else is a repository variable:

| Kind | Name | Required | Notes |
| --- | --- | --- | --- |
| Secret | `AZURE_OPENAI_API_KEY` | yes (Azure path) | Never logged. |
| Variable | `AZURE_OPENAI_ENDPOINT` | yes (Azure path) | e.g. `https://<resource>.openai.azure.com` |
| Variable | `AZURE_OPENAI_DEPLOYMENT` | yes (Azure path) | Deployment name, not model name. |
| Variable | `AZURE_OPENAI_API_VERSION` | no | Defaults to `2024-10-21`. |
| Variable | `AZURE_OPENAI_TEMPERATURE` | no | Omit unless your deployment accepts it. |
| Secret | `OPENAI_API_KEY` | no | Used only when Azure is not configured. |
| Secret | `BOT_GH_PAT` | recommended | Lets the merge commit trigger the Pages deploy workflow. |
| Variable | `AI_DEBUG_RESPONSE` | no | **Debug logging is ON by default**; set to `false` to silence it. |

Each Azure setting falls back to a secret of the same name, so existing secret-only setups keep
working.

### Debug logging

`AI_DEBUG_RESPONSE` defaults to `true`. When enabled the run logs the provider used, the raw model
message (truncated to 2000 characters) and the parsed operations. API keys, headers and endpoint
URLs are never logged, but model-generated content is — set the repository variable
`AI_DEBUG_RESPONSE` to `false` if that is not acceptable.

### Payload format

```jsonc
// POST /repos/rprabhakar789/devfolio/dispatches
{
  "event_type": "portfolio-update",
  "client_payload": {
    "instruction": "Add Rust at intermediate level to my languages",
    "source": "gmail",
    "subject": "portfolio update"
  }
}
```

The same instruction can be supplied manually via the workflow's `workflow_dispatch` input.

### Auto-merge intent

A PR is opened for every successful run. It is merged automatically only when the instruction
contains an explicit phrase: `merge and deploy`, `auto merge`, `auto-merge`, `publish this`,
`ship this`, or `go live` — and only after the PR's checks pass. Otherwise the PR waits for review.

### Email trigger (Gmail)

`examples/gmail-apps-script.gs` watches a Gmail label and dispatches matching mail. Script
Properties:

- `GITHUB_TOKEN` — PAT with `repo` scope
- `GITHUB_REPO` — defaults to `rprabhakar789/devfolio`
- `GMAIL_LABEL` — defaults to `portfolio-update`
- `ALLOWED_SENDERS` — **required** comma-separated allowlist, e.g. `you@gmail.com, you@work.com`.
  Addresses are trimmed and lowercased; mail from anyone else is left unread and labeled for
  manual review, and is never dispatched.

### Safety

- Only `content/about.md`, `content/contact.yaml`, `content/experience.yaml`,
  `content/education.yaml`, `content/projects.yaml` and `content/skills.yaml` may be written.
  Anything else fails the run before any file is touched.
- Operations that cannot be normalised onto the documented schemas fail the run — they are never
  partially applied.
- If operations are produced but the resulting diff is empty, the run **fails** rather than opening
  an empty PR.
- `npm run validate:content` and `npm run build` must pass before a PR is opened.

### Runbook

| Symptom | Where to look | Fix |
| --- | --- | --- |
| `using stub provider` | Run agent pipeline step | Azure key/endpoint/deployment not all set. |
| `Operation normalization failed` | `[llm-ops] Normalization error …` lines | The model produced a shape outside the contract; refine `docs/portfolio-agent-knowledge-base.md`. |
| `no content diff` | `[llm-ops]` summary | The requested change already exists. |
| `Path validation failed` | `[llm-ops]` | The model tried to edit outside `content/`; expected, no action needed. |
| PR merged but site unchanged | Deploy workflow | Merge used `GITHUB_TOKEN`; configure `BOT_GH_PAT`. |

The model's view of the content contracts lives in `docs/portfolio-agent-knowledge-base.md`, which
is read at runtime and injected into the system prompt for both Azure OpenAI and OpenAI. Edit that
file to change how instructions are interpreted.

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
