'use strict';

const candles = require('../candles');
const moment = require('moment');
const config = require('../../modules/configReader');
const _ = require('underscore');
const async = require('async');

module.exports = function (app) {
  const exchanges = {
    poloniex: new candles.poloniex(app.locals.redis),
    bittrex: new candles.bittrex(app.locals.redis),
  };

  this.getCandles = function (params, error, success) {
    const options = thisOptions(params.e, params.d);

    if (options.exchange === null) {
      return error({ success: false, error: 'Invalid Exchange' });
    }

    if (!config.marketWatcher.enabled) {
      return success({ success: true, candles: [] });
    }

    options.exchange.restoreCandles(
      options.duration,
      options.index,
      function (err, reply) {
        if (err) {
          return error({ success: false });
        } else {
          return success({
            success: true,
            timeframe: options.duration,
            exchange: options.exchange.name,
            candles: rejectCandles(reply, options.maxTime),
          });
        }
      },
    );
  };

  this.getStatistics = function (e, error, success) {
    const options = thisOptions(e, 'minute');

    if (options.exchange === null) {
      return error({ success: false, error: 'Invalid Exchange' });
    }

    if (!config.marketWatcher.enabled) {
      const statistics = {
        last: Number(0).toFixed(8),
        high: Number(0).toFixed(8),
        low: Number(0).toFixed(8),
        btcVolume: Number(0).toFixed(8),
        adamantVolume: Number(0).toFixed(8),
        numTrades: 0,
      };

      return success({ success: true, statistics: statistics });
    }

    async.parallel(
      [
        function (callback) {
          options.exchange.restoreCandles(
            options.duration,
            options.index,
            function (err, reply) {
              if (err) {
                return callback(err);
              } else {
                return callback(null, rejectCandles(reply, options.maxTime));
              }
            },
          );
        },
        function (callback) {
          options.exchange.restoreCandles('minute', -1, function (err, reply) {
            if (err) {
              return callback(err);
            } else {
              return callback(null, reply[0]);
            }
          });
        },
      ],
      function (err, results) {
        if (err) {
          return error({ success: false });
        } else {
          let statistics = {
            last: _.last(results[0]),
            high: _.max(results[0], function (c) {
              return parseFloat(c.high);
            }).high,
            low: _.min(results[0], function (c) {
              return parseFloat(c.low);
            }).low,
            btcVolume: _.reduce(
              results[0],
              function (memo, t) {
                return memo + parseFloat(t.btcVolume);
              },
              0.0,
            ).toFixed(8),
            adamantVolume: _.reduce(
              results[0],
              function (memo, t) {
                return memo + parseFloat(t.adamantVolume);
              },
              0.0,
            ).toFixed(8),
            numTrades: _.reduce(
              results[0],
              function (memo, t) {
                return memo + parseInt(t.numTrades);
              },
              0,
            ),
          };

          statistics = {
            last: statistics.last ? statistics.last.close : results[1].close,
            high: statistics.high ? statistics.high : Number(0).toFixed(8),
            low: statistics.low ? statistics.low : Number(0).toFixed(8),
            btcVolume: statistics.btcVolume,
            adamantVolume: statistics.adamantVolume,
            numTrades: statistics.numTrades,
          };

          return success({
            success: true,
            exchange: options.exchange.name,
            statistics: statistics,
          });
        }
      },
    );
  };

  // Private

  const validExchange = function (e) {
    if (
      !_.has(config.marketWatcher.exchanges, e) ||
      !config.marketWatcher.exchanges[e] ||
      !exchanges[e]
    ) {
      return null;
    }
    return exchanges[e];
  };

  const validDuration = function (d) {
    if (_.contains(['minute', 'hour', 'day'], d)) {
      return d;
    } else {
      return 'minute';
    }
  };

  const thisOptions = function (e, d) {
    const options = {
      exchange: validExchange(e),
      duration: validDuration(d),
    };

    if (options.duration === 'minute') {
      options.index = -1440;
      options.maxTime = moment().subtract(1, 'day');
    } else if (options.duration === 'hour') {
      options.index = -2016;
      options.maxTime = moment().subtract(3, 'month');
    } else if (options.duration === 'day') {
      options.index = -1095;
      options.maxTime = moment().subtract(3, 'years');
    }

    return options;
  };

  const rejectCandles = function (candles, maxTime) {
    return _.reject(candles, function (c) {
      return moment.unix(c.timestamp).isBefore(maxTime);
    });
  };
};
