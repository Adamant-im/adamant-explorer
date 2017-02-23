'use strict';

var orders = require('../lib/orders'),
    async = require('async');

module.exports = function (config, client) {
    this.updateOrders = function () {
        if (running) {
            console.error('Orders:', 'Update already in progress');
            return;
        } else {
            running = true;
        }
        async.series([
            function (callback) {
                if (!config.marketWatcher.exchanges.poloniex) {
                    callback(null);
                } else {
                    poloniex.updateOrders(function (err, res) {
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
                    bittrex.updateOrders(function (err, res) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, res);
                        }
                    });
                }
            }
        ],
        function (err, results) {
            if (err) {
                console.error('Orders:', 'Error updating orders:', err);
            } else {
                console.log('Orders:', 'Updated successfully');
            }
            running = false;
        });
    };

    // Interval

    if (config.marketWatcher.enabled) {
        setInterval(this.updateOrders, config.marketWatcher.orders.updateInterval);
    }

    // Private

    var poloniex = new orders.poloniex(client),
        bittrex = new orders.bittrex(client),
        running = false;
};
