# Contributing to ADAMANT Explorer

Thank you for improving ADAMANT Explorer. Changes should protect data correctness, runtime reliability, security of public-facing endpoints, and contributor clarity.

## Before you start

- Search [existing issues](https://github.com/Adamant-im/adamant-explorer/issues) before opening a new one
- Use a concise issue prefix such as `[Bug]`, `[Feat]`, `[Refactor]`, `[Docs]`, `[Test]`, or `[Chore]`
- Base work on `dev` and target `dev` in pull requests; `master` represents stable releases
- Keep changes focused and easy to review
- Never commit or log passphrases, private keys, or sensitive tokens

All repository artifacts—including code, comments, documentation, commits, issues, and pull requests—must be written in English.

## Development setup

Use Node.js `^22.18.0 || >=24.11.0`:

```sh
git clone https://github.com/Adamant-im/adamant-explorer.git
cd adamant-explorer
git switch dev
npm install
```

Copy and adjust the runtime configuration:

```sh
cp config.default.jsonc config.jsonc
```

The self-hosting requirements and configuration options are documented in the [README](./README.md). Create a dedicated branch for your work:

```sh
git switch -c feat/short-description
```

## Development workflow

Start the backend and Vite development server together:

```sh
npm run dev
```

The backend listens on <http://localhost:6040>. Vite provides hot reload at <http://localhost:5173> and proxies `/api` and Socket.IO traffic to the backend.

To run only Vite against an already running backend on port `6040`, use:

```sh
npm run dev:frontend
```

To continuously rebuild the production bundle into `public/` without the Vite development server, use:

```sh
npm run watch
```

Create a one-time production bundle with:

```sh
npm run build
```

## Debugging

Set `log_level` to `debug` in the active configuration file for the most detailed application and ADAMANT API client output. Request logs deliberately omit query strings so public addresses and user-supplied values are not collected unnecessarily.

For backend-only debugging, run:

```sh
npm start
```

For Testnet debugging, copy the default configuration, replace `nodes_adm` with Testnet nodes, and start the dedicated mode:

```sh
cp config.default.jsonc config.test.jsonc
npm run start:testnet
```

Redis failures are non-fatal: Explorer continues without response caching or persisted rolling statistics. If all configured ADAMANT nodes are unavailable, Node-backed API responses and live views remain unavailable until the shared client recovers.

## Validation

Run the baseline checks before submitting:

```sh
npm run lint
npm run format:check
npm run build
npm run test:unit
```

The API test suite runs against a live explorer instance connected to the ADAMANT Testnet. Start the instance in one terminal:

```sh
npm run start:testnet
```

Run the suite in another terminal:

```sh
npm test
```

Run API handler benchmarks when a change affects request performance:

```sh
npm run benchmark
```

Report the exact commands run and any skipped or blocked validation in the pull request.

## Code style

- Prettier formats the code with 2-space indentation and single quotes; run `npm run format`
- ESLint uses the flat configuration in `eslint.config.mjs` and must pass without errors
- Write JSDoc for exported functions and reusable helpers, including purpose, parameters, return values, and error behavior
- Add comments only for non-obvious control flow, normalization, security decisions, compatibility behavior, or workarounds

Architecture, implementation boundaries, API contracts, and detailed repository invariants are maintained in [AGENTS.md](./AGENTS.md).

## Pull requests

- Use a title in `Type: Short summary` form, for example `Fix: Handle empty peer list in Network Monitor`
- Link related issues explicitly
- Explain API or config changes and include migration notes when behavior changes
- Update documentation when behavior, setup, or workflows change
- Keep dependency additions minimal and explain networking or parsing dependencies

Small reviewable commits are welcome; maintainers may squash them when merging.
