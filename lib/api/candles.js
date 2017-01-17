'use strict';

var candles = require('../candles'),
    moment = require('moment'),
    config = require('../../config'),
    _ = require('underscore'),
    async = require('async');

module.exports = function (app) {
    var exchanges = {
        poloniex: new candles.poloniex(app.locals.redis),
        bittrex:  new candles.bittrex(app.locals.redis)
    }

    this.getCandles = function (params, error, success) {
        var options = thisOptions(params.e, params.d);

    	if (options.exchange === null) {
    	   return error({ success : false, error : 'Invalid Exchange' });
    	}

        if (!config.marketWatcher.enabled) {
            return success({ success : true, candles : [] });
        }

        options.exchange.restoreCandles(options.duration, options.index, function (err, reply) {
            if (err) {
                return error({ success : false });
            } else {
                return success({ success : true, 'timeframe' : options.duration, 'exchange' : options.exchange.name,  candles : rejectCandles(reply, options.maxTime) });
            }
        });
    };

    this.getStatistics = function (e, error, success) {
        var options = thisOptions(e, 'minute');

        if (options.exchange === null) {
            return error({ success : false, error : 'Invalid Exchange' });
        }

        if (!config.marketWatcher.enabled) {
            var statistics = {
                last      : Number(0).toFixed(8),
                high      : Number(0).toFixed(8),
                low       : Number(0).toFixed(8),
                btcVolume : Number(0).toFixed(8),
                liskVolume : Number(0).toFixed(8),
                numTrades : 0
            };

            return success({ success : true, statistics : statistics });
        }

        async.parallel([
            function (callback) {
                options.exchange.restoreCandles(options.duration, options.index, function (err, reply) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, rejectCandles(reply, options.maxTime));
                    }
                });
            },
            function (callback) {
                options.exchange.restoreCandles('minute', -1, function (err, reply) {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, reply[0]);
                    }
                });
            }
        ],
        function (err, results) {
            if (err) {
                return error({ success : false });
            } else {
                var statistics = {
                    last      : _.last(results[0]),
                    high      : _.max(results[0], function (c) { return parseFloat(c.high); }).high,
                    low       : _.min(results[0], function (c) { return parseFloat(c.low); }).low,
                    btcVolume : _.reduce(results[0], function (memo, t) { return (memo + parseFloat(t.btcVolume)); }, 0.0).toFixed(8),
                    liskVolume : _.reduce(results[0], function (memo, t) { return (memo + parseFloat(t.liskVolume)); }, 0.0).toFixed(8),
                    numTrades : _.reduce(results[0], function (memo, t) { return (memo + parseInt(t.numTrades)); }, 0)
                };

                statistics = {
                    last      : statistics.last ? statistics.last.close : results[1].close,
                    high      : statistics.high ? statistics.high : Number(0).toFixed(8),
                    low       : statistics.low ? statistics.low : Number(0).toFixed(8),
                    btcVolume : statistics.btcVolume,
                    liskVolume : statistics.liskVolume,
                    numTrades : statistics.numTrades
                };

                return success({ success : true, 'exchange' : options.exchange.name, statistics : statistics });
            }
        });
    };

    // Private

    var validExchange = function (e) {
        if (!_.has(config.marketWatcher.exchanges, e) || !config.marketWatcher.exchanges[e] || !exchanges[e]) {
            return null;
        } 
        return exchanges[e];
    };

    var validDuration = function (d) {
        if (_.contains(['minute', 'hour', 'day'], d)) {
            return d;
        } else {
            return 'minute';
        }
    };

    var thisOptions = function (e, d) {
        var options = {
            exchange: validExchange(e),
            duration: validDuration(d)
        };

        if (options.duration === 'minute') {
            options.index   = -1440;
            options.maxTime = moment().subtract(1, 'day');
        } else if (options.duration === 'hour') {
            options.index   = -2016;
            options.maxTime = moment().subtract(3, 'month');
        } else if (options.duration === 'day') {
            options.index   = -1095;
            options.maxTime = moment().subtract(3, 'years');
        }

        return options;
    };

    var rejectCandles = function (candles, maxTime) {
        return _.reject(candles, function (c) {
            return moment.unix(c.timestamp).isBefore(maxTime);
        });
    };
};
