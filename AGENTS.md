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
- Do not add project-specific technical guidance until the project documentation and current implementation have been refreshed

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

- Current repository code, `README.md`, and passing validation commands
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
