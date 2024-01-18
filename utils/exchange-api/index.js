const axios = require('axios');
const _ = require('underscore');
const util = require('util');
const async = require('async');
const logger = require('../log');

module.exports = function (config) {
  // No need to init if exchange rates are disabled
  if (!config.exchangeRates.enabled) {
    return false;
  }

  const exchanges = {
    'BTCUSD': {
      'bitfinex': [
        'Bitfinex',
        'https://api.bitfinex.com/v1/pubticker/BTCUSD',
        (res, cb) => {
          if (res.message) {
            return cb(res.message);
          } else {
            return cb(null, res.last_price);
          }
        },
      ],
      'bitstamp': [
        'Bitstamp',
        'https://www.bitstamp.net/api/v2/ticker/btcusd/',
        (res, cb) => {
          return cb(null, res.last);
        },
      ],
    },
    'BTCEUR': {
      'bitstamp': [
        'Bitstamp',
        'https://www.bitstamp.net/api/v2/ticker/btceur/',
        (res, cb) => {
          return cb(null, res.last);
        },
      ],
      'bitmarket': [
        'Bitmarket',
        'https://www.bitmarket.pl/json/BTCEUR/ticker.json',
        (res, cb) => {
          return cb(null, res.last);
        },
      ],
    },
    'BTCPLN': {
      'bitmarket': [
        'Bitmarket',
        'https://www.bitmarket.pl/json/BTCPLN/ticker.json',
        (res, cb) => {
          return cb(null, res.last);
        },
      ],
    },
    'BTCRUB': {
      'exmo': [
        'Exmo',
        'https://api.exmo.com/v1/ticker/',
        (res, cb) => {
          if (res.error) {
            return cb(res.error);
          } else {
            return cb(null, res.BTC_RUB.last_trade);
          }
        },
      ],
    },
    'LSKBTC': {
      'poloniex': [
        'Poloniex',
        'https://poloniex.com/public?command=returnTicker',
        (res, cb) => {
          if (res.error) {
            return cb(res.error);
          } else {
            return cb(null, res.BTC_LSK.last);
          }
        },
      ],
    },
    'LSKCNY': {
      'jubi': [
        'Jubi',
        'https://www.jubi.com/api/v1/ticker/?coin=lsk',
        (res, cb) => {
          if (res.last) {
            return cb(null, res.last);
          } else {
            return cb('Unable to get last price');
          }
        },
      ],
      'bitbays': [
        'Bitbays',
        'https://bitbays.com/api/v1/ticker/?market=lsk_cny',
        (res, cb) => {
          if (res.status === 200 && res.message === 'ok' && res.result.last) {
            return cb(null, res.result.last);
          } else {
            return cb('Unable to get last price');
          }
        },
      ],
    },
  };

  _.each(config.exchangeRates.exchanges, (coin1, key1) => {
    _.each(coin1, (exchange, key2) => {
      if (!exchange) {
        return;
      }

      const pair = key1 + key2;

      if (exchanges[pair].hasOwn(exchange)) {
        logger.info('Exchange: ' + util.format('Configured [%s] as %s/%s exchange', exchange, key1, key2));
        config.exchangeRates.exchanges[key1][key2] = exchanges[pair][exchange];
        config.exchangeRates.exchanges[key1][key2].pair = pair;
      } else if (exchanges[pair]) {
        const ex_name = Object.keys(exchanges[pair])[0];
        const ex = exchanges[pair][ex_name];
        logger.error('Exchange: ' + util.format('Unrecognized %s/%s exchange', key1, key2));
        logger.error('Exchange: ' + util.format('Defaulting to [%s]', ex_name));
        config.exchangeRates.exchanges[key1][key2] = ex;
        config.exchangeRates.exchanges[key1][key2].pair = pair;
      } else {
        logger.error('Exchange: ' + util.format('Unrecognized %s/%s pair, deleted', key1, key2));
        //  remove() is undefined, should be updated if used
        // remove(config.exchangeRates.exchanges[key1][key2]);
      }
    });
  });

  const requestTicker = function (options, cb) {
    axios({
      url: options[1],
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return cb(util.format('Response code: %s!', response.status));
        } else {
          return options[2](response.data, cb);
        }
      })
      .catch((err) => {
        return cb(err);
      });
  };

  return {
    getPriceTicker: (cb) => {
      const currency = {};
      const isNumeric = (n) => {
        return !isNaN(parseFloat(n)) && isFinite(n);
      };

      async.forEachOf(config.exchangeRates.exchanges, (exchange, key1, seriesCb, result) => {
          currency[key1] = {};
          async.forEachOf(exchange, (exchange2, key2, seriesCb2, result2) => {
              requestTicker(exchange2, (err, result) => {
                if (result && isNumeric(result)) {
                  currency[key1][key2] = result;
                } else {
                  logger.error(util.format('Cannot receive exchange rates for %s/%s pair from [%s], ignored', key1, key2, exchange2[0]));
                }
                seriesCb2(null, currency);
              });
            },
            (err) => {
              seriesCb(null, currency);
            });
        },
        (err) => {
          logger.error('Exchange rates: ' + currency);
          cb(null, currency);
        });
    },
  };
};
