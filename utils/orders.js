'use strict';

const orders = require('../lib/orders');
const async = require('async');
const logger = require('./logger');

module.exports = function (config, client) {
  this.updateOrders = function () {
    if (running) {
      logger.error('Orders:', 'Update already in progress');
      return;
    } else {
      running = true;
    }

    async.series([
        (callback) => {
          if (!config.marketWatcher.exchanges.poloniex) {
            callback(null);
          } else {
            poloniex.updateOrders((err, res) => {
              if (err) {
                callback(err);
              } else {
                callback(null, res);
              }
            });
          }
        },
        (callback) => {
          if (!config.marketWatcher.exchanges.bittrex) {
            callback(null);
          } else {
            bittrex.updateOrders((err, res) => {
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
          logger.error('Orders:', 'Error updating orders:', err);
        } else {
          logger.info('Orders:', 'Updated successfully');
        }
        running = false;
      });
  };

  // Interval

  if (config.marketWatcher.enabled) {
    setInterval(this.updateOrders, config.marketWatcher.orders.updateInterval);
  }

  // Private

  const poloniex = new orders.poloniex(client);
  const bittrex = new orders.bittrex(client);
  let running = false;
};
