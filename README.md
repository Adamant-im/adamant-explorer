# ADAMANT Explorer

ADAMANT Explorer is the blockchain explorer for [ADAMANT](https://adamant.im) — a decentralized blockchain messenger. It shows blocks, transactions, accounts, delegates, and the network state of the ADAMANT blockchain.

Deployed at:

- [Clear web](https://explorer.adamant.im)
- [Tor](http://srovpmanmrbmbqe63vp5nycsa3j3g6be3bz46ksmo35u5pw7jjtjamid.onion)

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

## Features

- Blocks, transactions, accounts, and delegate pages with search
- Delegate Monitor: forging status of active and standby delegates
- Network Monitor: peers with versions, height, and geo location on a map
- Activity Graph: live visualization of the latest blocks and transactions
- Top Accounts and reserved wallets
- Live updates over WebSocket
- Redis-backed API response cache and persistent rolling block-statistics window
- All node interaction through [adamant-api-jsclient](https://github.com/Adamant-im/adamant-api-jsclient) with node health checks and failover
- Vue 3 frontend (vue-router, Pinia) built with Vite; each page loads as its own chunk

## Requirements

- Node.js 22.13 or newer
- Redis — caches API responses and retains the rolling block-statistics window between Explorer restarts. Enable Redis RDB or AOF persistence if the window must also survive Redis or host restarts

  ```sh
  sudo apt-get install -y redis-server
  ```

- PM2 (recommended) — keeps the explorer process running and rotates logs

  ```sh
  sudo npm install -g pm2
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 100M
  ```

## Installation

```sh
git clone https://github.com/Adamant-im/adamant-explorer.git
cd adamant-explorer
npm install
```

### Configuration

The explorer uses `config.jsonc` when present, and `config.default.jsonc` otherwise:

```sh
cp config.default.jsonc config.jsonc
nano config.jsonc
```

Parameters are documented with comments in the config file. Provide several independently operated ADAMANT nodes in `nodes_adm` — the client checks node health and fails over automatically. Prefer HTTPS nodes because plaintext HTTP does not authenticate the remote endpoint or protect responses from modification in transit.

Set `log_level` to `none`, `error`, `warn`, `info`, `log`, or `debug`; `debug` is the most verbose troubleshooting level.

Network Monitor peer geo-location uses the maintained [GeoJS API](https://www.geojs.io/). It is enabled by default and sends peer IP addresses to GeoJS and its infrastructure providers. Review the [GeoJS privacy policy](https://www.geojs.io/privacy/), and set `geoLocation.enabled` to `false` if this tradeoff is not acceptable. Results are requested in batches, normalized for the frontend, cached by IP, and refreshed daily. Failed lookups are retried after five minutes; peers still render when GeoJS is disabled or unavailable.

`trustedProxies` controls which reverse proxies may supply the client IP used by API rate limiting. The default `["loopback"]` supports nginx on the same host and ignores arbitrary forwarding headers received directly from the internet. Use an empty array for direct exposure only, or list the exact proxy IPs/CIDRs for another topology. The accepted `proxy-addr` names expand as follows:

| Name | Trusted networks |
| --- | --- |
| `loopback` | `127.0.0.0/8`, `::1/128` |
| `linklocal` | `169.254.0.0/16`, `fe80::/10` |
| `uniquelocal` | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7` |

Prefer exact proxy IPs or CIDRs. A named range trusts every address in that range, so use `linklocal` or `uniquelocal` only when every possible proxy hop in that range is controlled. Every trusted proxy must overwrite forwarding headers.

For a local nginx process, use the real client socket address rather than preserving a client-supplied chain:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_pass http://127.0.0.1:6040;
```

### Explorer HTTP API

Explorer HTTP routes are same-origin UI implementation details, not a general-purpose ADAMANT developer API. Integrations should use [adamant-api](https://github.com/Adamant-im/adamant-api-jsclient). The UI currently uses these routes:

- `/api/getAccount`
- `/api/getTopAccounts`
- `/api/getLastBlocks`
- `/api/getBlock`
- `/api/totalSupply`
- `/api/search`
- `/api/getTransaction`
- `/api/getLastTransfers`
- `/api/getTransactionsByAddress`
- `/api/getTransfersByAddress`
- `/api/getTransactionsByBlock`
- `/api/delegates/getStandby`

Responses do not opt into cross-origin browser access. API requests are limited in-process to 300 requests per minute per client IP; static assets and Socket.IO are excluded. The limit applies independently in each Explorer process.

`GET /api/networkHealth` is the supported operational monitoring endpoint. It returns HTTP `200` with `live`, `degraded`, or `critical` status and a coherent height/forging snapshot. It returns HTTP `503` with `status: "unavailable"` when no coherent snapshot can be produced.

### Build the frontend

Build the production bundle into `public/`:

```sh
npm run build
```

During development, either rebuild on every change:

```sh
npm run watch
```

Or start the backend and Vite dev server together. Vite provides hot reload and proxies `/api` and Socket.IO traffic to the backend on `localhost:6040`:

```sh
npm run dev
```

Open <http://localhost:5173>. To run only Vite against an already running backend on `localhost:6040`, use:

```sh
npm run dev:frontend
```

## Usage

Check that the explorer is configured correctly:

```sh
npm start
```

Open <http://localhost:6040>, or replace `localhost` with the external IP address of the machine.

Once verified, stop the process with `CTRL+C` and start it with PM2:

```sh
pm2 start pm2-explorer.json
```

Runtime status and log locations:

```sh
pm2 list
```

Stop the explorer:

```sh
pm2 stop adamant-explorer
```

## Tests

Frontend utility unit tests run in plain Node and need no services:

```sh
npm run test:unit
```

The API test suite runs against a live explorer connected to the ADAMANT Testnet. Configure the explorer and a local node for testnet, start the explorer, and run:

```sh
npm test
```

Run other checks:

```sh
npm run lint
npm run format:check
npm run benchmark
```

## Security

The repository includes the current [threat model](./adamant-explorer-threat-model.md) and [security and reliability review](./security_best_practices_report.md). Report suspected vulnerabilities privately to the maintainers before public disclosure when exploitation could put users or infrastructure at risk.

## Contribution

Contributions are welcome. Read the [contribution guidelines](./CONTRIBUTING.md) for development setup, validation, and pull request conventions.

## Links

- [ADAMANT website](https://adamant.im) — the ADAMANT project and Messenger apps
- [ADAMANT documentation](https://docs.adamant.im) — protocol and API docs
- [ADAMANT node](https://github.com/Adamant-im/adamant) — ADM blockchain node software
- [adamant-api-jsclient](https://github.com/Adamant-im/adamant-api-jsclient) — JavaScript SDK used for node interaction
- [AIPs](https://aips.adamant.im) — ADAMANT Improvement Proposals
- [ADAMANT API schema](https://schema.adamant.im) — node API specification
- [currencyinfo](https://github.com/Adamant-im/currencyinfo) — self-hosted crypto rates service, planned as the ADM rates source

## License

Copyright © 2017-2026 ADAMANT developer community, ADAMANT Foundation, and ADAMANT Tech Labs
Copyright © 2016-2017 Lisk Foundation

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the [GNU General Public License](./LICENSE) along with this program. If not, see <http://www.gnu.org/licenses/>.

---

This program also incorporates work previously released with lisk-explorer `1.1.0` (and earlier) versions under the [MIT License](https://opensource.org/licenses/MIT). To comply with the requirements of that license, the following permission notice, applicable to those parts of the code only, is included below:

Copyright © 2016-2017 Lisk Foundation

Copyright © 2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
