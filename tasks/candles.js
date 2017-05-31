'use strict';

var config = require('../config'),
    client = require('../redis')(config),
    candles = require('../lib/candles'),
    async = require('async');

module.exports = function (grunt) {
    grunt.registerTask('candles:build', 'Build exchange candle data.', function () {
        var done = this.async();

        async.series([
            function (callback) {
                // Skip exchange if not enabled
                if (!config.marketWatcher.exchanges.poloniex) {
                    return callback(null);
                }

                var poloniex = new candles.poloniex(client, config.marketWatcher.candles.poloniex);

                poloniex.buildCandles(function (err, res) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, res);
                    }
                });
            },
            function (callback) {
                // Skip exchange if not enabled
                if (!config.marketWatcher.exchanges.bittrex) {
                    return callback(null);
                }

                var bittrex = new candles.bittrex(client);

                bittrex.buildCandles(function (err, res) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, res);
                    }
                });
            }
        ],
        function (err, results) {
            if (err) {
                grunt.log.error(err);
                done(false);
            } else {
                done(true);
            }
        });
    });

    grunt.registerTask('candles:update', 'Update exchange candle data.', function () {
        var done = this.async();

        async.series([
            function (callback) {
                // Skip exchange if not enabled
                if (!config.marketWatcher.exchanges.poloniex) {
                    return callback(null);
                }

                var poloniex = new candles.poloniex(client);

                poloniex.updateCandles(function (err, res) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, res);
                    }
                });
            },
            function (callback) {
                // Skip exchange if not enabled
                if (!config.marketWatcher.exchanges.bittrex) {
                    return callback(null);
                }

                var bittrex = new candles.bittrex(client);

                bittrex.updateCandles(function (err, res) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, res);
                    }
                });
            }
        ],
        function (err, results) {
            if (err) {
                grunt.log.error(err);
                done(false);
            } else {
                done(true);
            }
        });
    });
};
