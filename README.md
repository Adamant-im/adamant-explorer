# ADAMANT Explorer

ADAMANT Explorer is the blockchain explorer for [ADAMANT](https://adamant.im) — a decentralized blockchain messenger. It shows blocks, transactions, accounts, delegates, and the network state of the ADAMANT blockchain.

Deployed at:

- [Clear web](https://explorer.adamant.im)
- [Tor](http://srovpmanmrbmbqe63vp5nycsa3j3g6be3bz46ksmo35u5pw7jjtjamid.onion)

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

> Built and maintained by the ADAMANT developer community and **cryptofoundry**.
> Want custom crypto software, bots, payments or blockchain infrastructure built by engineers with production blockchain experience? [Tell us what to build](https://adamant.business#contact).
>

## Features

- Blocks, transactions, accounts, and delegate pages with search
- Delegate Monitor: forging status of active and standby delegates
- Network Monitor: peers with versions, height, and geo location on a map
- Activity Graph: live visualization of the latest blocks and transactions
- Top Accounts and reserved wallets
- Live updates over WebSocket

## Requirements

- Node.js `^22.18.0 || >=24.11.0`
- Redis (recommended) — enables API response caching and preserves the rolling block-statistics window between Explorer restarts. Explorer remains available without Redis, but caching and persisted statistics are disabled.

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
npm run build
```

### Configuration

The explorer uses `config.jsonc` when present, and `config.default.jsonc` otherwise:

```sh
cp config.default.jsonc config.jsonc
nano config.jsonc
```

Parameters are documented with comments in the config file. Provide several independently operated ADAMANT nodes in `nodes_adm` — the client checks node health and fails over automatically. Prefer HTTPS nodes because plaintext HTTP does not authenticate the remote endpoint or protect responses from modification in transit.

Set `log_level` to `none`, `error`, `warn`, `info`, `log`, or `debug`; `debug` is the most verbose troubleshooting level.

Network Monitor peer geo-location uses the maintained [GeoJS API](https://www.geojs.io/). It is enabled by default and sends peer IP addresses to GeoJS and its infrastructure providers. Review the [GeoJS privacy policy](https://www.geojs.io/privacy/), and set `geoLocation.enabled` to `false` if this tradeoff is not acceptable. Peers still render when GeoJS is disabled or unavailable.

Network Monitor map imagery is fetched by the explorer process from [OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/) and served at `/osm-tiles/{z}/{x}/{y}.png`. Same-origin tiles keep the map working in Tor Browser on onion sites (which omit `Referer`) and avoid exposing browser tile requests directly to OSM.

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

## Running Explorer

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
pm2 logs adamant-explorer
```

Stop the explorer:

```sh
pm2 stop adamant-explorer
```

### Monitoring and integrations

Explorer HTTP routes support its own UI and are not a general-purpose ADAMANT developer API. Browser responses are same-origin and API traffic is rate-limited. Applications and integrations should use [adamant-api-jsclient](https://github.com/Adamant-im/adamant-api-jsclient) instead.

`GET /api/networkHealth` is the supported operational monitoring endpoint. It returns HTTP `200` with `live`, `degraded`, or `critical` status and a coherent height/forging snapshot. It returns HTTP `503` with `status: "unavailable"` immediately while the Node SDK is starting or when no coherent snapshot can be produced.

## Security

The repository includes the current [threat model](./adamant-explorer-threat-model.md) and [security and reliability review](./security_best_practices_report.md). Report suspected vulnerabilities privately to the maintainers before public disclosure when exploitation could put users or infrastructure at risk.

## Development and contributing

Contributions are welcome. Development setup, tests, debugging, code style, and pull request conventions are documented in [CONTRIBUTING.md](./CONTRIBUTING.md).

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
