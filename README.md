Lisk Blockchain Explorer
========================

Lisk blockchain explorer version 0.3. Works with Lisk wallet API. Uses Redis for caching data and Freegeoip for IP geo-location.

# Required Components

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

# Freegeoip

Freegeoip is used by the Network Monitor for IP address geo-location.

Installation is very simple. Download and unpack the latest release from: https://github.com/fiorix/freegeoip/releases

Then start the server in the background, using the following command:

```
./freegeoip > /dev/null 2>&1 &
```

# Configuration

`config.json` file contains configuation settings.

Example:

```
{
    "configuration" : {
        "development": {
            "host": "0.0.0.0",
            "port": 8040
        },
        "production": {
            "host": "0.0.0.0",
            "port": 80
        },
        "lisk" : {
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
        "cacheTTL" : 20,
        "fixedPoint" : 100000000,
        "enableCandles" : true,
        "updateCandlesInterval" : 30000,
        "enableOrders" : true,
        "updateOrdersInterval" : 30000,
        "enableExchange" : true,
        "updateExchangeInterval" : 900000,
        "btcusdExchange" : "bitfinex",
        "liskbtcExchange" : "poloniex"
    }
}
```

* `cacheTTL` - time to live cache in redis.
* `fixedPoint` - fixed point number of Lisk (10^8).
* `enableCandles` - enable or disable updating of candlestick data.
* `updateCandlesInterval` - time to update candlestick data.
* `enableOrders` - enable or disable updating of order book data.
* `updateOrdersInterval` - time to update order book data.
* `enableExchange` - enable or disable exchange currency courses.
* `updateExchangeInterval` - time to update exchange currency courses.
* `btcusdExchange` - default is bitfinex, alternatives are: bitstamp & btce.
* `liskbtcExchange` - default is poloniex, alternatives are: bter & cryptsy.

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

# Market Watcher

To build candlestick data for each exchange run:

```
grunt candles:build
```

To update candlestick data manually run:

```
grunt candles:update
```

During runtime candlestick data is updated automatically.

# Benchmarks

To run benchmark tests run:

```
node benchmark.js
```

# Launch

Development:

```
node app.js
```

Open: [http://localhost:8040](http://localhost:8040)

Production:

```
NODE_ENV=production node app.js
```

Open: [http://localhost](http://localhost)

Ports for both mode can be found in `config.json`

# Top Accounts

To enable Top Accounts functionality, start your lisk node _(not the explorer)_ using the following command:

```
TOP=true node app.js
```
