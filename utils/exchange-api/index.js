var request = require('request'),
    util = require('util');

module.exports = function (config) {
    var exchanges = {
        BTCUSD : {
            bitstamp  : [
                "Bitstamp",
                "https://www.bitstamp.net/api/ticker/",
                function (res, cb) {
                    return cb(null, res.last);
                }
            ],
            bitfinex  : [
                "Bitfinex",
                "https://api.bitfinex.com/v1/pubticker/BTCUSD",
                function (res, cb) {
                    if (res.message) {
                        return cb(res.message);
                    } else {
                        return cb(null, res.last_price);
                    }
                }
            ]
        },
        XCRBTC : {
            cryptsy : [
                "Cryptsy",
                "http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=280",
                function (res, cb) {
                    if (res.error) {
                        return cb(res.error);
                    } else {
                        return cb(null, res.return.markets.XCR.lasttradeprice);
                    }
                }
            ],
            poloniex : [
                "Poloniex",
                "https://poloniex.com/public?command=returnTicker",
                function (res, cb) {
                    if (res.error) {
                        return cb(res.error);
                    } else {
                        return cb(null, res.BTC_XCR.last);
                    }
                }
            ]
        }
    }

    if (exchanges.BTCUSD.hasOwnProperty(config.btcusdExchange)) {
        config.btcusdExchange = exchanges.BTCUSD[config.btcusdExchange];
        console.log(util.format("Configured %s as BTC/USD exchange", config.btcusdExchange[0]));
    } else {
        console.log("Warning: Unrecognized BTC/USD exchange!");
        console.log("Defaulting to Bitfinex...");
        config.btcusdExchange = exchanges.BTCUSD.bitfinex;
    }

    if (exchanges.XCRBTC.hasOwnProperty(config.xcrbtcExchange)) {
        config.xcrbtcExchange = exchanges.XCRBTC[config.xcrbtcExchange];
        console.log(util.format("Configured %s as XCR/BTC exchange", config.xcrbtcExchange[0]));
    } else {
        console.log("Warning: Unrecognized XCR/BTC exchange!");
        console.log("Defaulting to Poloniex...");
        config.xcrbtcExchange = exchanges.XCRBTC.poloniex;
    }

    var requestTicker = function (type, options, cb) {
        request.get({
            url : options[1],
            json: true
        }, function (err, response, body) {
            if (err) {
                return cb(err);
            } else if (response.statusCode != 200) {
                return cb(util.format("Response code: %s!", response.statusCode));
            } else {
                return options[2](body, cb);
            }
        });
    }

    return {
        getTicker: function (type, cb) {
            if (type == "BTCUSD") {
                return requestTicker(type, config.btcusdExchange, cb);
            } else if (type == "XCRBTC") {
                return requestTicker(type, config.xcrbtcExchange, cb);
            } else {
                return cb(util.format("Unrecognized '%s' ticker type!", type));
            }
        }
    }
}
