Crypti Blockchain Explorer
==========================

Crypti blockchain explorer version 0.2. Works with Crypti wallet API.
Uses Redis for caching data and Freegeoip for IP geolocation.

# Required components

 * Redis
 * Freegeoip (https://github.com/fiorix/freegeoip)
 * Bower
 * Grunt.js

# Installation

To install run:

```
npm install
bower install
```

# Configuration

`config.json` file contains configuation settings.

Example:

```
{
    "configuration" : {
        "development": {
            "host": "0.0.0.0",
            "port": 8080
        },
        "production": {
            "host": "0.0.0.0",
            "port": 80
        },
        "crypti" : {
            "host" : "127.0.0.1",
            "port" : 6040
        },
        "freegeoip" : {
            "host" : "127.0.0.1",
            "port" : 8080
        },
        "redis" : {
            "host" : "127.0.0.1",
            "port" : 6379,
            "password" : ""
        },
        "updateTopAccountsInterval" : 10800000,
        "cacheTTL" : 20,
        "fixedPoint" : 100000000,
        "enableExchange" : true,
        "updateExchangeInterval" : 900000
    }
}
```

   * `updateTopAccountsInterval` - time to update top accounts in interval.
   * `cacheTTL` - time to live cache in redis.
   * `fixedPoint` - fixed point number of Crypti (10^8).
   * `enableExchange` - enable or disable exchange currency courses.
   * `updateExchangeInterval` - time to update exchange currency courses.

# Build

Frontend must be built with grunt:

```
grunt compile
```

If you want to work with frontend and see updates in realtime run:

```
grunt
```

It will update css/js files as changes are made.

# Launch

Development:

```
node app.js
```

Open: [http://localhost:8080](http://localhost:8080)

Production:

```
NODE_ENV=production node app.js
```

Open: [http://localhost](http://localhost)

Ports for both mode can be found in `config.json`

# Top Accounts

Top Acccounts functionality is only supported when using a special version of Crypti which has modified source code.
