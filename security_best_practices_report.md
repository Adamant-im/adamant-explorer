# Security and Reliability Review

> Security audited by [cryptofoundry](https://adamant.business#contact).
> Review date: 2026-07-19.
>

## Executive summary

The review found no unauthenticated code execution, authentication bypass, secret exposure, or transaction-submission path. The highest confirmed issue was an HTML interpretation path in Network Monitor popups fed by untrusted Node/geo data. Medium findings covered permissive and oversized API behavior, missing abuse controls, stale-cache route resurrection, overlapping monitor polling, and unsafe proxy/CSP assumptions. These findings are remediated in this branch with focused tests. Remaining work is bounded to peer-privacy policy (#20), incompatible dependency upgrades (#34), comprehensive successful Node-payload schema validation (#35), and outage retry/log coalescing (#36).

## Critical findings

No critical findings were confirmed.

## High findings

### SBP-001: Node-controlled peer data reached an HTML rendering sink

- Rule ID: VUE-XSS-001 / JS-XSS-001
- Severity: High, remediated
- Location: `src/views/NetworkMonitorView.vue:65` (`createPeerPopup`)
- Evidence: The current implementation creates DOM elements and assigns labels and values through `textContent` and `createTextNode` at lines 71–92; it replaced popup HTML string construction
- Impact: A malicious or compromised Node/peer/geolocation response could previously attempt same-origin DOM XSS in every Network Monitor visitor
- Fix: Build Leaflet popup content exclusively from DOM text nodes, validate coordinates, use `Map` for peer-keyed dictionaries, and allowlist presentation classes
- Mitigation: The CSP at `app.js:59` and `modules/httpSecurity.js:93` restricts scripts, objects, framing, base URLs, and connection destinations
- False positive notes: Vue template interpolation was already escaped; the confirmed risk was the Leaflet HTML-string boundary

## Medium findings

### SBP-002: Public parameters allowed type confusion and excessive Node queries

- Rule ID: EXPRESS-INPUT-001 / EXPRESS-INPUT-002
- Severity: Medium, remediated
- Location: `api/lib/adamant/helpers/validation.js:17`, `api/lib/adamant/helpers/validation.js:85`, and `api/lib/adamant/helpers/validation.js:118`
- Evidence: Central controls now validate uint64 identifiers, ADAMANT addresses, canonical bounded integers, exact query keys, scalar shapes, and duplicate parameters before handlers forward values
- Impact: Crafted arrays, objects, prefixes such as `12junk`, unbounded pagination, or arbitrary transaction filters could cause incorrect responses and avoidable ADAMANT Node load
- Fix: Add endpoint-specific allowlists and remove the advanced transaction-filter passthrough
- Mitigation: The 300-request fixed-window limit at `modules/apiRateLimiter.js:46` bounds routine per-client abuse
- False positive notes: The API is read-only, so the impact is availability and data correctness rather than ledger mutation

### SBP-003: Explorer exposed a broad legacy API with wildcard CORS and no basic rate limit

- Rule ID: EXPRESS-CORS-001 / EXPRESS-DOS-001
- Severity: Medium, remediated
- Location: `app.js:47`, `app.js:55`, `app.js:95`, `app.js:97`, and `modules/apiSurface.js:16`
- Evidence: Wildcard CORS is removed; routing is strict and case-sensitive; the surface guard rejects unknown, removed, mixed-case, and non-GET API requests before Redis or Node readiness; the limiter returns standard and legacy rate metadata
- Impact: Third-party browser applications could consume Explorer as a general API, removed endpoints expanded maintenance risk, and abusive clients had no application-level request budget
- Fix: Retain exactly 12 UI routes plus `/api/networkHealth`, remove 16 legacy registrations, omit permissive CORS, and apply 300 requests per minute per `req.ip`
- Mitigation: Deployments with multiple replicas should enforce the intended aggregate budget at the reverse proxy
- False positive notes: Removing CORS is not authentication and does not prevent direct HTTP clients, which is documented in `README.md`

### SBP-004: Cache middleware could cross route/method boundaries and revive removed endpoints

- Rule ID: EXPRESS-INPUT-001 / data-integrity control
- Severity: Medium, remediated
- Location: `app.js:97`, `app.js:100`, `app.js:139`, and `cache.js:10`
- Evidence: Exact supported-path guarding now precedes cache lookup; cache reads/stores accept only supported GET routes; request-time network health bypasses Redis; block-sensitive keys include height and block ID
- Impact: A stale legacy key could temporarily return a removed endpoint, unsupported methods could receive cached GET data, and volatile chain data could outlive a fork or block transition
- Fix: Gate cache operations by method and exact route contract, reject unsupported routes before Redis, and version volatile keys by trusted block identity
- Mitigation: Keep Redis private and monitor parse/read errors
- False positive notes: Query parameters were already part of `originalUrl`; the confirmed gaps were method/surface ordering and volatile identity

### SBP-005: Socket monitor intervals could overlap and continue after lifecycle changes

- Rule ID: EXPRESS-DOS-001 / runtime reliability
- Severity: Medium, remediated
- Location: `sockets/activityGraph.js:103`, `sockets/header.js:158`, `sockets/networkMonitor.js:85`, and `sockets/delegateMonitor.js:327`
- Evidence: Pollers schedule the next run only after the current loader settles, retry with bounded backoff, track lifecycle generations, clear timers on the last disconnect, and ignore stale callbacks
- Impact: Slow or failed Node calls could create overlapping bursts, noisy retry storms, stale emissions, and avoidable ADAMANT Node load
- Fix: Replace fixed intervals with serialized timeouts and generation-aware retry scheduling
- Mitigation: Retain last coherent snapshots during partial failures and alert on sustained retry transitions
- False positive notes: One duplicate cached snapshot can occur for multiple clients simultaneously leaving readiness; it is harmless and does not duplicate upstream polling

### SBP-006: Proxy trust and CSP WebSocket sources were not safely constrained

- Rule ID: EXPRESS-PROXY-001 / EXPRESS-HEADERS-001 / VUE-HEADERS-001
- Severity: Medium, remediated
- Location: `modules/configValidation.js:51`, `modules/httpSecurity.js:13`, and `app.js:47`
- Evidence: Proxy entries must be explicit IPs, CIDRs, or named private ranges and cannot trust all addresses; the default trusts loopback only; Host is strictly normalized before exact same-host `ws:` and `wss:` CSP sources are emitted
- Impact: Incorrect proxy trust lets users spoof limiter identity, while raw Host interpolation can expand a security policy or malformed CSP can break live monitors
- Fix: Validate the topology, use Express `trust proxy` before the limiter, normalize CLI ports, and generate a conservative CSP with required same-host Socket.IO compatibility
- Mitigation: Local nginx should overwrite `X-Forwarded-For` with the socket client address as documented
- False positive notes: `connect-src 'self'` alone does not cover WebSocket schemes in every browser, so explicit validated WebSocket sources are intentional

## Low findings

### SBP-007: Optional external refreshes could overlap or replace usable state after failure

- Rule ID: EXPRESS-SSRF-001 / runtime reliability
- Severity: Low, remediated
- Location: `utils/exchange.js:68`, `api/lib/adamant/helpers/geolocation.js`, and `config.default.jsonc:22`
- Evidence: Destinations are fixed HTTPS URLs, requests have timeouts, provider data is normalized, exchange refreshes cannot overlap, failed refreshes preserve previous rates, and geolocation can be disabled
- Impact: External slowness could otherwise increase outbound load or remove optional data from core pages
- Fix: Add an in-flight guard and preserve last-known values; keep peer geolocation optional and bounded
- Mitigation: Monitor aggregate provider failures without logging full response payloads
- False positive notes: GeoJS receives peer IPs by design when enabled; this is a privacy tradeoff, not SSRF

### SBP-008: Startup and access logging had correctness and data-minimization gaps

- Rule ID: EXPRESS-ERROR-001 / EXPRESS-FINGERPRINT-001
- Severity: Low, remediated
- Location: `app.js:37`, `app.js:189`, `app.js:207`, and `utils/httpLogging.js:31`
- Evidence: CLI ports are normalized to TCP integers rather than IPC paths, listen errors fail fast, HTTP headers/request timers are explicit, errors return stable JSON, Express fingerprinting is disabled, and access logs omit query strings
- Impact: Invalid startup inputs could bind incorrectly; default errors/fingerprinting and query logging could expose unnecessary operational or user-supplied details
- Fix: Validate port/proxy inputs, add custom 404/error handling, bound HTTP request timers, disable `X-Powered-By`, and log only method/path/status/timing/size
- Mitigation: Keep production log access restricted and rotate logs through the documented process manager
- False positive notes: Public addresses and transaction identifiers are not secrets, but omitting query strings still minimizes collection

## Dependency posture and update plan

`npm audit --json` reported 0 vulnerabilities across 510 total dependencies: 0 critical, high, moderate, low, or informational findings.

`npm outdated --json` reported:

- Patch updates for `@vitejs/plugin-vue`, ESLint, Prettier, and Vue
- Incompatible major releases for Vite 8, Pinia 4, and Vue Router 5

No dependency was changed in this focused patch because no advisory requires an urgent update. Major migrations are tracked in #34 with route, store, bundle, and browser regression criteria.

## Privacy and accepted risks

- Exact peer IP, hostname, city, country, and map location remain visible in Network Monitor by current product design
- Enabling GeoJS sends validated peer IPs to GeoJS and its infrastructure providers
- #20 tracks whether masking, generalization, or backend redaction should become configurable or default
- Public ledger metadata remains intentionally visible; Explorer does not expose message content through the reviewed history/list paths
- The limiter is intentionally in-process and does not provide a cross-replica aggregate
- Reverse-proxy TLS, WAF, firewall, Redis network isolation, and CSP reporting are deployment controls not represented in this repository
- The default Node list retains one legacy plaintext HTTP fallback for compatibility; HTTPS entries are preferred and operators can remove the fallback
- Successful ADAMANT Node response shapes are not yet validated uniformly; #35 tracks that larger trust-boundary change
- Complete dependency outages still produce repeated background Node health and Redis reconnect logs; #36 tracks shared single-flight refresh, backoff, and log deduplication

## Verification record

Completed during the review:

- `npm run lint`
- `npm run format:check`
- `npm run test:unit`
- `npm run build`
- `npm audit --json`
- `npm outdated --json`
- `git diff --check`
- Focused proxy, rate-limit, API surface, input validation, health-state, cache, CSP, external refresh, frontend routing/rendering, and socket lifecycle tests
- Degraded runtime smoke with ADAMANT Node and Redis unavailable: SPA routes remained available, removed API routes stayed closed, static traffic remained outside the limiter, and cache failures stayed non-fatal

The live Testnet API suite still requires a separately running Explorer connected to ADAMANT Testnet. Its route-specific tests were reduced to the retained HTTP surface, but no Testnet service was available in this workspace run.
