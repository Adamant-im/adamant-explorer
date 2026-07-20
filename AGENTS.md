# ADAMANT Explorer: AI Agent Operating Manual

This document defines how AI agents must work in this repository.

## Mission

Agent output must optimize for:

1. Correctness and reliability of explorer behavior
2. Security and privacy of user-facing blockchain data flows
3. Open-source maintainability and contributor clarity
4. Focused changes that are easy to review

If tradeoffs are required, preserve security, data correctness, and runtime reliability first.

## Language Policy

- Developers may communicate with AI in any language
- All repository artifacts must be in English only
- Write all code, comments, docs, commit messages, issue text, and PR text in English

## Writing And Documentation Policy

- Use concise, operational wording over marketing language
- In bullet and numbered lists, do not add a trailing period when an item contains one sentence
- If an item contains two or more sentences, end every sentence with a period
- Keep documentation aligned with current code and passing validation commands
- If documentation sources disagree, prefer current repository behavior and document the mismatch

## Documentation Ownership

- `README.md` is for Explorer users and self-hosting operators: features, installation, runtime configuration, operation, privacy, security, and public integration guidance
- `CONTRIBUTING.md` is the developer guide and the source of truth for local setup, development commands, testing, debugging, code style, and pull request preparation
- `AGENTS.md` owns repository architecture, implementation contracts, security invariants, agent workflows, and organization conventions
- Link to the owning document instead of copying command lists, route lists, or implementation details across files

## Project Layout

- `app.js`: Express application, middleware, Redis response cache, and startup
- `api/routes/`: HTTP API route definitions
- `api/lib/adamant/requests/`: the only layer that talks to ADAMANT nodes, through `adamant-api`
- `api/lib/adamant/handlers/` and `api/lib/adamant/helpers/`: response assembly and data shaping
- `sockets/`: Socket.IO namespaces for live pages (header, Delegate Monitor, Network Monitor, Activity Graph)
- `modules/`: config loading and validation, API surface/rate limiting, and HTTP security policy
- `utils/`: logger, exchange rates, known addresses
- `src/`: Vue 3 frontend (Composition API, vue-router, Pinia) built with Vite into `public/`
- `src/views/` and `src/components/`: page and shared single-file components; `src/lib/`: framework-free utilities; `src/static/`: files copied to `public/` verbatim
- `vite.config.mjs`: frontend build configuration and dev-server proxy
- `test/`: Mocha API test suite that runs against a live explorer instance; `test/unit/` holds Node-only unit tests for `src/lib/`
- `benchmark/`: API handler benchmarks

## Technical Rules

- Node.js 22.13 or newer; CommonJS on the backend, ES modules and Vue single-file components in `src/`
- Frontend routes must stay URL-compatible with previous explorer versions; existing deep links may not break
- Keep `src/lib/` utilities framework-free so `test/unit/` can import them in plain Node; use explicit `.js` extensions in their imports
- All node interaction must go through `adamant-api` (adamant-api-jsclient) in `api/lib/adamant/requests/`; do not call node endpoints with a raw HTTP client elsewhere
- `adamant-api` responses are normalized: check `response.success`, read `response.errorMessage` on failure
- Prettier formats the code (2-space indentation, single quotes); ESLint flat config in `eslint.config.mjs` must pass with no errors
- Config files are JSONC parsed with `jsonminify` and `JSON.parse`: comments are allowed, trailing commas are not

## Runtime And API Contracts

- Middleware order in `app.js` is security-sensitive: headers and static serving precede API rate limiting; the exact API surface guard precedes Redis lookup and ADAMANT readiness; route responses are cached only after successful handlers
- `api/lib/adamant/constants.mjs` is the only source of truth for `SUPPORTED_API_PATHS`; backend guards, frontend calls, routes, and tests must remain aligned with it
- Explorer exposes 12 same-origin UI routes plus `GET /api/networkHealth`; do not add wildcard CORS or present the UI routes as a general-purpose integration API
- The API limiter is an in-process fixed window of 300 requests per minute per client IP; it applies to `/api` paths, including health, and excludes static files and Socket.IO
- `GET /api/networkHealth` returns HTTP `200` for computed `live`, `degraded`, or `critical` states and HTTP `503` with `status: "unavailable"` when no coherent snapshot is possible
- Redis is optional at runtime: read/write failures bypass the response cache, while the rolling statistics handlers retry persistence without taking down core HTTP/static serving
- `api/lib/adamant/requests/` is the only ADAMANT Node boundary; successful Node payloads remain untrusted until normalized or validated by handlers/helpers
- Socket.IO retains four public namespaces for Header, Delegate Monitor, Network Monitor, and Activity Graph; polling must remain serialized, lifecycle-aware, and bounded during upstream failures
- The Vue frontend is built from `src/` into ignored/generated `public/`; never edit generated bundle files directly

## Validation Commands

`CONTRIBUTING.md` is the source of truth for development, debugging, and validation commands. Agents must run its baseline checks when relevant, add focused checks for the changed risk area, and report every command result or explicit blocker.

## Markdown Rules For AI-Generated Docs

- Keep one blank line before and after every Markdown list
- Keep a blank line between a heading and the list that follows it
- Use fenced code blocks with matching opening and closing fences
- Include a language tag for fenced code blocks whenever practical
- Prefer stable relative links for files in this repository

## JSDoc And Code Comments

- Write JSDoc for public modules, exported functions, reusable helpers, and functions you materially change
- Document purpose, parameters, return values, side effects, and error behavior when they are not obvious from the implementation
- Describe value semantics and constraints, not only types
- Keep JSDoc and comments synchronized with code changes in the same patch
- Add short explanatory comments for non-obvious control flow, data normalization, security decisions, compatibility behavior, or workaround rationale
- Avoid comments that merely restate what a single line of code already says
- Prefer clear names and small functions first, then add comments where context still matters

## Sources Of Truth

Use these sources when implementing or reviewing changes:

- Current repository code, `README.md`, `CONTRIBUTING.md`, and passing validation commands
- ADAMANT organization governance: <https://github.com/Adamant-im/.github>
- Recommended issue title prefixes: <https://github.com/orgs/Adamant-im/discussions/5>
- Recommended labels for issues and discussions: <https://github.com/orgs/Adamant-im/discussions/1>
- ADAMANT Node agent baseline: <https://github.com/Adamant-im/adamant/blob/dev/AGENTS.md>
- ADAMANT Messenger PWA agent guide: <https://github.com/Adamant-im/adamant-im/blob/dev/AGENTS.md>
- ADAMANT Console agent guide: <https://github.com/Adamant-im/adamant-console/blob/dev/AGENTS.md>
- ADAMANT documentation: <https://docs.adamant.im>
- ADAMANT API schema: <https://schema.adamant.im>

If sources disagree:

1. Treat current repository behavior and passing tests as implementation truth
2. Do not silently ignore mismatches
3. Document the mismatch and propose a synchronized fix or follow-up issue

## Issue, Label, And PR Conventions

Follow organization-wide conventions:

- Governance repository: <https://github.com/Adamant-im/.github>
- Prefix guidance: <https://github.com/orgs/Adamant-im/discussions/5>
- Label catalog: <https://github.com/orgs/Adamant-im/discussions/1>

### Issue Workflow

1. Search existing open issues first to avoid duplicates
2. Use org issue forms from `Adamant-im/.github/.github/ISSUE_TEMPLATE/*`
3. Start the title with one concise issue prefix
4. Apply labels from the org label catalog
5. Link related issues and PRs explicitly
6. Add project placement only when the target repository workflow requires it

### Issue Title Prefixes

Use one or two prefixes maximum:

- `[Bug]` for bugs, crashes, or wrong behavior
- `[Feat]` for new functionality
- `[Enhancement]` for improvements of existing functionality
- `[Refactor]` for internal refactoring without intended behavior change
- `[Docs]` for documentation updates
- `[Test]` for testing work
- `[Chore]` for maintenance and routine technical tasks
- `[Task]` for general tasks
- `[Composite]` for multi-part work with sub-tasks
- `[UX/UI]` for user experience or interface work
- `[Proposal]`, `[Idea]`, or `[Discussion]` for forum-level ideation

### Label Policy

- `labels.json` in `Adamant-im/.github` is the source of truth for label names, colors, descriptions, and casing
- Use a minimal but informative set of labels
- Prefer one type/status label such as `bug`, `enhancement`, `Task`, or `Composite task`
- Add domain labels such as `documentation`, `Guideline`, `Web`, `JavaScript`, `NodeJS`, `Security`, or `Privacy` when relevant
- Add priority labels such as `High priority` only when justified
- Keep repository-specific label casing exactly as configured in GitHub

### PR Conventions

- Use org PR template sections when available: `Description`, `Related issue`, `How to test`, and `Checklist`
- Reference issues with closing keywords when appropriate, for example `Closes #123`
- Use `Type: Short summary` for PR titles, for example `Docs: Add AI agent instructions`
- Do not use issue-style square-bracket prefixes in PR titles
- Keep PR title type aligned with the work: `Docs:`, `Fix:`, `Feat:`, `Refactor:`, `Test:`, or `Chore:`
- Include validation steps and mention any risk areas

## Command-Line Workflow

When a CLI tool accepts multi-line input, use a temporary file in `.ai-ignored/` instead of inline multi-line shell strings.

Preferred examples:

```bash
gh issue create --body-file .ai-ignored/temp.YYYY-MM-DD.issue-body.md
gh pr create --body-file .ai-ignored/temp.YYYY-MM-DD.pr-description.md
git commit -F .ai-ignored/temp.YYYY-MM-DD.commit-message.md
```

Rules:

- Use descriptive dated filenames
- Keep scratch files in `.ai-ignored/`
- Cleanup is optional because `.ai-ignored/` is ignored
- Do not accidentally reuse stale body files

## Security And Privacy Rules

- Never log, print, or expose passphrases, private keys, mnemonic seeds, tokens, or credentials
- Keep input validation strict for public inputs, query parameters, and configuration values
- Do not introduce dynamic code execution, unsafe deserialization, or unvalidated shell execution paths
- Do not add analytics, telemetry, fingerprinting, or hidden third-party tracking
- Minimize new dependencies, especially for cryptography, networking, parsing, or build tooling
- Prefer existing trusted project patterns before adding new abstractions or libraries

## Change Discipline

1. Read relevant files end-to-end before editing
2. Identify behavior and interfaces that must stay unchanged
3. Make the smallest safe change
4. Add or update tests when behavior changes
5. Run the most relevant validation commands available
6. Report exact commands run, results, assumptions, and remaining gaps

Avoid broad rewrites unless the task explicitly requires them and validation coverage is clear.

## Documentation Drift Policy

When behavior and docs diverge:

1. Document the exact mismatch with file or URL references
2. Update this repository when the fix belongs here
3. Open linked follow-up issues for companion repositories when cross-repo work is needed
4. Do not freeze stale implementation details into `AGENTS.md`

## Validation Policy

For any non-trivial change, report exactly what was run.

Baseline checks to consider:

- `git diff --check`
- Markdown lint for documentation-only changes when available
- Project lint and tests relevant to touched files
- Build or runtime smoke checks when behavior, assets, or bundling change

If a check cannot be run because dependencies, services, or credentials are unavailable, report the blocker clearly.

## Definition Of Done

A change is done only when:

- Repository artifacts are in English
- Security and privacy expectations remain intact
- The patch is focused and reviewable
- Relevant validation has been run or the blocker is explicit
- Issue and PR metadata follow ADAMANT organization conventions
