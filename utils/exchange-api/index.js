var request = require('request'),
    util = require('util');

module.exports = function (config) {
    var exchanges = {
        BTCUSD : {
            bitfinex  : [
                'Bitfinex',
                'https://api.bitfinex.com/v1/pubticker/BTCUSD',
                function (res, cb) {
                    if (res.message) {
                        return cb(res.message);
                    } else {
                        return cb(null, res.last_price);
                    }
                }
            ],
            bitstamp  : [
                'Bitstamp',
                'https://www.bitstamp.net/api/ticker/',
                function (res, cb) {
                    return cb(null, res.last);
                }
            ],
            btce  : [
                'Btc-e',
                'https://btc-e.com/api/3/ticker/btc_usd',
                function (res, cb) {
                  if (res.error) {
                      return cb(res.error);
                  } else {
                      return cb(null, res.btc_usd.last);
                  }
                }
            ]
        },
        LISKBTC : {
            bter : [
                'Bter',
                'http://data.bter.com/api/1/ticker/xcr_btc',
                function (res, cb) {
                    if (res.message) {
                        return cb(res.message);
                    } else {
                        return cb(null, res.last);
                    }
                }
            ],
            cryptsy : [
                'Cryptsy',
                'http://pubapi.cryptsy.com/api.php?method=singlemarketdata&marketid=280',
                function (res, cb) {
                    if (res.error) {
                        return cb(res.error);
                    } else {
                        return cb(null, res.return.markets.LISK.lasttradeprice);
                    }
                }
            ],
            poloniex : [
                'Poloniex',
                'https://poloniex.com/public?command=returnTicker',
                function (res, cb) {
                    if (res.error) {
                        return cb(res.error);
                    } else {
                        return cb(null, res.BTC_LISK.last);
                    }
                }
            ]
        }
    }

    if (exchanges.BTCUSD.hasOwnProperty(config.btcusdExchange)) {
        config.btcusdExchange = exchanges.BTCUSD[config.btcusdExchange];
        console.log('Exchange:', util.format('Configured %s as BTC/USD exchange', config.btcusdExchange[0]));
    } else {
        console.log('Exchange:', 'Warning: Unrecognized BTC/USD exchange!');
        console.log('Exchange:', 'Defaulting to Bitfinex...');
        config.btcusdExchange = exchanges.BTCUSD.bitfinex;
    }

    if (exchanges.LISKBTC.hasOwnProperty(config.xcrbtcExchange)) {
        config.xcrbtcExchange = exchanges.LISKBTC[config.xcrbtcExchange];
        console.log('Exchange:', util.format('Configured %s as LISK/BTC exchange', config.xcrbtcExchange[0]));
    } else {
        console.log('Exchange:', 'Warning: Unrecognized LISK/BTC exchange!');
        console.log('Exchange:', 'Defaulting to Poloniex...');
        config.xcrbtcExchange = exchanges.LISKBTC.poloniex;
    }

    var requestTicker = function (type, options, cb) {
        request.get({
            url : options[1],
            json: true
        }, function (err, response, body) {
            if (err) {
                return cb(err);
            } else if (response.statusCode != 200) {
                return cb(util.format('Response code: %s!', response.statusCode));
            } else {
                return options[2](body, cb);
            }
        });
    }

    return {
        getTicker: function (type, cb) {
            if (type == 'BTCUSD') {
                return requestTicker(type, config.btcusdExchange, cb);
            } else if (type == 'LISKBTC') {
                return requestTicker(type, config.xcrbtcExchange, cb);
            } else {
                return cb(util.format('Unrecognized \'%s\' ticker type!', type));
            }
        }
    }
}
