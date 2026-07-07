# Contributing to ADAMANT Explorer

Thank you for improving ADAMANT Explorer. Changes should protect data correctness, runtime reliability, security of public-facing endpoints, and contributor clarity.

## Before you start

- Search [existing issues](https://github.com/Adamant-im/adamant-explorer/issues) before opening a new one.
- Use a concise issue prefix such as `[Bug]`, `[Feat]`, `[Refactor]`, `[Docs]`, `[Test]`, or `[Chore]`.
- Base work on `dev` and target `dev` in pull requests. `master` represents stable releases.
- Keep changes focused and easy to review.
- Never commit or log passphrases, private keys, or sensitive tokens.

All repository artifacts—including code, comments, documentation, commits, issues, and pull requests—must be written in English.

## Development setup

Use Node.js 22.13 or newer:

```sh
git clone https://github.com/Adamant-im/adamant-explorer.git
cd adamant-explorer
git switch dev
npm install
```

Create a dedicated branch for your work:

```sh
git switch -c feat/short-description
```

The explorer needs Redis and access to ADAMANT nodes to run, see the [README](./README.md) for the full setup.

## Validation

Run the baseline checks before submitting:

```sh
npm run lint
npm run format:check
npm run build
npm run test:unit
```

During frontend work, `npm run dev` starts the Vite dev server with hot reload; it proxies `/api` and Socket.IO traffic to a backend running on `localhost:6040`.

The API test suite runs against a live explorer instance connected to the ADAMANT Testnet:

```sh
npm start          # in a separate terminal, with a testnet config
npm test
```

Report the exact commands run and any skipped or blocked validation in the pull request.

## Project structure

- `app.js`: Express application, middleware, caching, and startup
- `api/routes/`: HTTP API route definitions
- `api/lib/adamant/`: node request layer, response handlers, and helpers
- `sockets/`: Socket.IO namespaces for live pages (header, monitors, activity graph)
- `modules/`: config reader
- `utils/`: logger, exchange rates, known addresses
- `src/`: Vue 3 frontend (vue-router, Pinia) built with Vite into `public/`
- `vite.config.mjs`: frontend build configuration and dev-server proxy
- `test/`: API test suite (Mocha, Chai, and Supertest) and Node-only unit tests in `test/unit/`
- `benchmark/`: API handler benchmarks

All interaction with ADAMANT nodes goes through [adamant-api-jsclient](https://github.com/Adamant-im/adamant-api-jsclient) in `api/lib/adamant/requests/`. Do not call node endpoints with a raw HTTP client elsewhere.

## Code style

- Prettier formats the code: 2-space indentation, single quotes. Run `npm run format`.
- ESLint (flat config in `eslint.config.mjs`) must pass with no errors: `npm run lint`.
- Write JSDoc for exported functions and reusable helpers: purpose, parameters, return values, and error behavior.
- Add short comments only where the code cannot explain itself: non-obvious control flow, data normalization, security decisions, or workaround rationale.

## Pull requests

- Use a title in `Type: Short summary` form, for example `Fix: Handle empty peer list in Network Monitor`.
- Link related issues explicitly.
- Explain API or config changes and include migration notes when behavior changes.
- Update documentation when behavior, setup, or workflows change.
- Keep dependency additions minimal and explain networking or parsing dependencies.

Small reviewable commits are welcome; maintainers may squash them when merging.
