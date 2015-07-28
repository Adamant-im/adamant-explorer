var candles = require('../candles'),
    moment = require('moment'),
    _ = require('underscore');

module.exports = function (app) {
    var bter = new candles.bter(app.locals.redis),
        poloniex = new candles.poloniex(app.locals.redis);

    this.getCandles = function (params, error, success) {
        var options = thisOptions(params.e, params.d);

        options.exchange.restoreCandles(options.duration, options.index, function (err, reply) {
            if (err) {
                return error({ success : false });
            } else {
                return success({ success : true, candles : rejectCandles(reply, options.maxTime) });
            }
        });
    }

    this.getStatistics = function (e, error, success) {
        var options = thisOptions(e, 'minute');

        options.exchange.restoreCandles(options.duration, options.index, function (err, reply) {
            if (err) {
                return error({ success : false });
            } else {
                var candles = rejectCandles(reply, options.maxTime);

                var statistics = {
                    last      : _.last(candles),
                    high      : _.max(candles, function (c) { return parseFloat(c.high) }).high,
                    low       : _.min(candles, function (c) { return parseFloat(c.low) }).low,
                    btcVolume : _.reduce(candles, function (memo, t) { return (memo + parseFloat(t.btcVolume)) }, 0.0).toFixed(8),
                    xcrVolume : _.reduce(candles, function (memo, t) { return (memo + parseFloat(t.xcrVolume)) }, 0.0).toFixed(8),
                    numTrades : _.reduce(candles, function (memo, t) { return (memo + parseInt(t.numTrades)) }, 0)
                }

                statistics = {
                    last      : statistics.last ? statistics.last.close : 0.0.toFixed(8),
                    high      : statistics.high ? statistics.high : 0.0.toFixed(8),
                    low       : statistics.low ? statistics.low : 0.0.toFixed(8),
                    btcVolume : statistics.btcVolume,
                    xcrVolume : statistics.xcrVolume,
                    numTrades : statistics.numTrades
                }

                return success({ success : true, statistics : statistics });
            }
        });
    }

    // Private

    var validExchange = function (e) {
        return (e === 'poloniex') ? poloniex : bter;
    }

    var validDuration = function (d) {
        if (_.contains(['minute', 'hour', 'day'], d)) {
            return d;
        } else {
            return d = 'minute';
        }
    }

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
    }

    var rejectCandles = function (candles, maxTime) {
        return _.reject(candles, function (c) {
            return moment.unix(c.timestamp).isBefore(maxTime);
        });
    }
}
