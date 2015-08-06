'use strict';

var candles = require('../lib/candles'),
    async = require('async');

module.exports = function (config, client) {
    this.updateCandles = function () {
        if (running) {
            console.error('Candles:', 'Update already in progress');
            return;
        } else {
            running = true;
        }
        async.series([
            function (callback) {
                bter.updateCandles(function (err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            function (callback) {
                poloniex.updateCandles(function (err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            }
        ],
        function (err, results) {
            if (err) {
                console.error('Candles:', 'Error updating candles:', err);
            }
            running = false;
        });
    };

    // Interval

    if (config.enableCandles) {
        setInterval(this.updateCandles, config.updateCandlesInterval);
    }

    // Private

    var bter = new candles.bter(client),
        poloniex = new candles.poloniex(client);

    var running = false;
};
