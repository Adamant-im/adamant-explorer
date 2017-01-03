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
                poloniex.updateCandles(function (err, res) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, res);
                    }
                });
            },
            function (callback) {
                bittrex.updateCandles(function (err, res) {
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
            } else {
                console.log('Candles:', 'Updated successfully');
            }
            running = false;
        });
    };

    // Interval

    if (config.enableCandles) {
        setInterval(this.updateCandles, config.updateCandlesInterval);
    }

    // Private

    var poloniex = new candles.poloniex(client),
        bittrex = new candles.bittrex(client),
        running = false;
};
