'use strict';

const candles = require('../lib/candles');
const async = require('async');
const logger = require('./logger');

module.exports = function (config, client) {
  this.updateCandles = function () {
    if (running) {
      logger.error('Candles:', 'Update already in progress');
      return;
    } else {
      running = true;
    }
    async.series([
        (callback) => {
          if (!config.marketWatcher.exchanges.poloniex) {
            callback(null);
          } else {
            poloniex.updateCandles((err, res) => {
              if (err) {
                callback(err);
              } else {
                callback(null, res);
              }
            });
          }

        },
        function (callback) {
          if (!config.marketWatcher.exchanges.bittrex) {
            callback(null);
          } else {
            bittrex.updateCandles((err, res) => {
              if (err) {
                callback(err);
              } else {
                callback(null, res);
              }
            });
          }
        },
      ],
      (err, results) => {
        if (err) {
          logger.error('Candles:', 'Error updating candles:', err);
        } else {
          logger.info('Candles:', 'Updated successfully');
        }
        running = false;
      });
  };

  // Interval

  if (config.marketWatcher.enabled) {
    setInterval(this.updateCandles, config.marketWatcher.candles.updateInterval);
  }

  // Private

  const poloniex = new candles.poloniex(client);
  const bittrex = new candles.bittrex(client);
  let running = false;
};
