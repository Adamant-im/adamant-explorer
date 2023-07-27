# ADAMANT Blockchain Explorer

ADAMANT is a Decentralized Blockchain Messenger. This repository holds an Explorer for ADAMANT blockchain. Deployed at:

- [Clear web](https://explorer.adamant.im)
- [Tor](http://srovpmanmrbmbqe63vp5nycsa3j3g6be3bz46ksmo35u5pw7jjtjamid.onion)

Read [more about ADAMANT](https://adamant.im).

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

## Usage and installation

### Prerequisites

These programs and resources are required to install and run ADAMANT Explorer:

- Node.js v10 or higher (<https://nodejs.org/>) — Node.js serves as the underlying engine for code execution.

  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
  source ~/.nvm/nvm.sh
  source ~/.profile
  source ~/.bashrc
  nvm i --lts=dubnium
  ```

- Redis (<http://redis.io>) — Redis is used for caching parsed exchange data.

  ```bash
  sudo apt-get install -y redis-server
  ```

- Freegeoip (<https://github.com/fiorix/freegeoip>) — Freegeoip is used by the Network Monitor for IP address geo-location.

  ```bash
  wget https://github.com/fiorix/freegeoip/releases/download/v3.4.1/freegeoip-3.4.1-linux-amd64.tar.gz
  tar -zxf freegeoip-3.4.1-linux-amd64.tar.gz
  ln -s freegeoip-3.4.1-linux-amd64 freegeoip
  nohup ./freegeoip/freegeoip > ./freegeoip/freegeoip.log 2>&1 &
  ```
  
- PM2 (<https://github.com/Unitech/pm2>) — PM2 manages the node process for ADAMANT Explorer and handles log rotation (Recommended)

  ```bash
  sudo npm install -g pm2
  ```
  
- PM2-logrotate (<https://github.com/pm2-hive/pm2-logrotate>) — Manages PM2 logs

  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 100M
  ```

- Git (<https://github.com/git/git>) — Used for cloning and updating ADAMANT Explorer

  ```bash
  sudo apt-get install -y git
  ```

- Tool chain components — Used for compiling dependencies

  ```bash
  sudo apt-get install -y python build-essential automake autoconf libtool libpng-dev pngquant pkg-config redis
  ```

### Installation Steps

Clone the ADAMANT Explorer Repository:

```bash
git clone https://github.com/Adamant-im/adamant-explorer.git
cd adamant-explorer
npm install
```

### Build Steps

#### Frontend

The frontend is using Webpack to create core bundles for ADAMANT Explorer.  
For having a watcher to generate bundles continuously for all the changes of the code, run:

```bash
npm run start
```

And for generating the minified bundles in production environment run:

```bash
npm run build
```

#### Configuration

The explorer will use `config.jsonc`, if available, or `config.default.jsonc` otherwise.

```bash
cp config.default.jsonc config.jsonc
nano config.jsonc
```

Parameters: see comments in config file.

#### Managing ADAMANT Explorer

To test that ADAMANT Explorer is configured correctly, run the following command:

```bash
npm run run
```

Open: <http://localhost:6040>, or if its running on a remote system, switch `localhost` for the external IP Address of the machine.

Once the process is verified as running correctly, `CTRL+C` and start the process with `PM2`. This will fork the process into the background and automatically recover the process if it fails.

```bash
pm2 start pm2-explorer.json
```

After the process is started its runtime status and log location can be found by issuing this statement:

```bash
pm2 list
```

To stop Explorer after it has been started with `PM2`, issue the following command:

```bash
pm2 stop adamant-explorer
```

#### Tests

Before running any tests, please ensure ADAMANT Explorer and ADAMANT Node are configured to run on the ADAMANT Testnet.

Then restart the ADAMANT Node (example):

```bash
pm2 restart /PATH_TO_ADAMANT_DIR/app.js
```

Launch ADAMANT Explorer (runs on port 6040):

```bash
pm2 start pm2-explorer.json
```

Run the test suite:

```bash
npm test
```

Run individual tests:

```bash
npm test -- test/api/accounts.js
npm test -- test/api/transactions.js
```

## License

Copyright © 2016-2017 Lisk Foundation ©2017-2018 ADAMANT Tech Labs

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the [GNU General Public License](https://github.com/adamant/adamant-explorer/tree/master/LICENSE) along with this program.  If not, see <http://www.gnu.org/licenses/>.

***

This program also incorporates work previously released with lisk-explorer `1.1.0` (and earlier) versions under the [MIT License](https://opensource.org/licenses/MIT). To comply with the requirements of that license, the following permission notice, applicable to those parts of the code only, is included below:

Copyright © 2018 ADAMANT TECH LABS LP

Copyright © 2016-2017 Lisk Foundation  
Copyright © 2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
