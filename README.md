# Lisk Blockchain Explorer

Lisk blockchain explorer version 1.0.0 works in conjunction with the Lisk core API. It uses Redis for caching data and Freegeoip to parse IP geo-location data.

[![Build Status](https://travis-ci.org/LiskHQ/lisk-explorer.svg?branch=development)](https://travis-ci.org/LiskHQ/lisk-explorer)

## Prerequisites

 * Nodejs v4.0.0 or higher (https://nodejs.org/) 
 * Redis (http://redis.io)
 * Freegeoip (https://github.com/fiorix/freegeoip)
 * Bower (http://bower.io/)
 * Grunt.js (http://gruntjs.com/)

## Installation

To install run:

```
npm install
bower install
```

## Redis - (Ubuntu Installation)

Redis is used for caching parsed exchange data. To install Redis perfom the following:

```
sudo apt-get install redis-server
```

Once installation is complete, run the server using the following command:

```
nohup redis-server &
```

## Freegeoip

Freegeoip is used by the Network Monitor for IP address geo-location.

Installation is very simple. Download and unpack the latest release from: https://github.com/fiorix/freegeoip/releases

Then start the server in the background, using the following command:

```
./freegeoip > /dev/null 2>&1 &
```

## Configuration

`config.json` file contains configuration settings.

Example:

```
{
    "configuration" : {
        "development": {
            "host": "0.0.0.0",
            "port": 6040
        },
        "production": {
            "host": "0.0.0.0",
            "port": 80
        },
        "lisk" : {
            "host" : "127.0.0.1",
            "port" : 8000
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
* `liskbtcExchange` - default is poloniex.

## Build

Frontend must be built with grunt:

```
grunt compile
```

If you want to work with frontend and see updates in realtime run:

```
grunt
```

It will update css/js files as changes are made.

## Market Watcher

To build candlestick data for each exchange run:

```
grunt candles:build
```

To update candlestick data manually run:

```
grunt candles:update
```

During runtime candlestick data is updated automatically.

## Benchmarks

To run benchmark tests run:

```
node benchmark.js
```

## Launch

Development:

```
node app.js
```

Open: [http://localhost:6000](http://localhost:6000)

Production:

```
NODE_ENV=production node app.js
```

Open: [http://localhost](http://localhost)

Ports for both mode can be found in `config.json`

## Top Accounts

To enable Top Accounts functionality, start your lisk node _(not the explorer)_ using the following command:

```
TOP=true node app.js
```

## License

The MIT License (MIT)

Copyright (c) 2016 Lisk  
Copyright (c) 2015 Crypti

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
