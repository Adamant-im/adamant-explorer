'use strict';

var async = require('async'),
    request = require('request'),
    moment  = require('moment'),
    _ = require('underscore');

function AbstractCandles (client) {
    var self = this;

    this.name  = 'exchange';
    this.key   = this.name + 'Candles';
    this.url   = '';
    this.start = 0;
    this.last  = null;

    this.response = {
        error : 'message',
        data  : 'data'
    };

    this.candle = {
        id     : 'tid',
        date   : 'date',
        price  : 'price',
        amount : 'amount'
    };

    this.duration  = 'minute';
    this.durations = ['minute', 'hour', 'day'];

    this.retrieveTrades = function (start, cb) {
        if (!start) { start = self.start || 0; }

        var found   = false,
            results = [];

        console.log('Candles:', 'Retrieving trades from', self.name + '...');

        async.doUntil(
            function (next) {
                request.get({
                    url : self.url + start,
                    json : true
                }, function (err, resp, body) {
                    if (err || resp.statusCode !== 200) {
                        return next(err || 'Response was unsuccessful');
                    }

                    var message = body[self.response.error];
                    if (message) {
                        return next(message);
                    }

                    var data = self.rejectTrades(body[self.response.data] || body);
                    if (!self.validData(data)) {
                        console.log('Candles:', 'Invalid data received');
                        return next();
                    }

                    if (self.validTrades(results, data)) {
                        console.log('Candles:', start.toString(), '=> Found', data.length.toString(), 'trades');
                        results = self.acceptTrades(results, data);
                        start   = self.nextStart(data);
                        return next();
                    } else {
                        found = true;
                        return next();
                    }
                });
            },
            function () {
                return found;
            },
            function (err) {
                if (err) {
                    return cb('Error retrieving trades: ' + err);
                } else {
                    console.log('Candles:', results.length.toString(), 'trades in total retrieved');
                    return cb(null, results);
                }
            }
        );
    };

    this.nextStart = function (data) {
        return 0;
    };

    this.rejectTrades = function (data) {
        if (self.last) {
            return _.reject(data, function (trade) {
                return (!trade ? true : trade[self.candle.id] <= self.last.lastTrade);
            });
        } else {
            return data;
        }
    };

    this.validData = function (data) {
        if (_.size(data) > 0) {
            return _.first(data)[self.candle.id];
        } else {
            return true;
        }
    };

    this.validTrades = function (results, data) {
        var any = _.size(data) > 0;

        if (any && _.size(results) > 0) {
            var firstLast = _.first(results)[self.candle.id] !== _.last(data)[self.candle.id],
                lastFirst = _.last(results)[self.candle.id] !== _.first(data)[self.candle.id];

            return (firstLast && lastFirst);
        } else {
            return any;
        }
    };

    this.acceptTrades = function (results, data) {
        return results.concat(data);
    };

    this.parseDate = function (date) {
        if (typeof date === 'string') {
            return moment.utc(date).startOf(self.duration);
        } else {
            return moment.unix(date).utc().startOf(self.duration);
        }
    };

    this.groupTrades = function (results, cb) {
        var groups = _.groupBy(results, function (trade) {
            return self.parseDate(trade[self.candle.date]).unix();
        });

        return cb(null, groups);
    };

    this.sumTrades = function (results, cb) {
        var sum = _.map(results, function (period) {
            return {
                timestamp  : self.parseDate(period[0][self.candle.date]).unix(),
                date       : self.parseDate(period[0][self.candle.date]).toDate(),
                high       : _.max(period, function (t) { return parseFloat(t[self.candle.price]); })[self.candle.price],
                low        : _.min(period, function (t) { return parseFloat(t[self.candle.price]); })[self.candle.price],
                open       : _.first(period)[self.candle.price],
                close      : _.last(period)[self.candle.price],
                liskVolume  : _.reduce(period, function (memo, t) { return (memo + parseFloat(t[self.candle.amount])); }, 0.0).toFixed(8),
                btcVolume  : _.reduce(period, function (memo, t) { return (memo + parseFloat(t[self.candle.amount]) * parseFloat(t[self.candle.price])); }, 0.0).toFixed(8),
                firstTrade : _.first(period)[self.candle.id],
                lastTrade  : _.last(period)[self.candle.id],
                nextStart  : self.nextStart(period),
                numTrades  : _.size(period)
            };
        });

        sum = _.reject(sum, function (s) {
            return s.timestamp >= moment.utc().startOf(self.duration).unix();
        });

        return cb(null, sum);
    };

    this.candleKey = function (duration) {
        if (!duration) {
            duration = self.duration;
        }
        return (self.key + ':by' + duration[0].toUpperCase() + duration.slice(1));
    };

    this.saveCandles = function (results, cb) {
        var multi = client.multi(),
            key   = self.candleKey();

        _.each(results, function (candle) {
            multi.RPUSH(key, JSON.stringify(candle));
        });

        multi.exec(function (err, replies) {
            if (err) {
                return cb(err);
            } else {
                console.log('Candles:', replies.length.toString(), 'candles saved');
                return cb(null, results);
            }
        });
    };

    this.restoreCandles = function (duration, index, cb) {
        client.LRANGE(self.candleKey(duration), index, -1, function (err, reply) {
            if (err) {
                return cb(err);
            } else {
                reply = JSON.parse('[' + reply.toString() + ']');
                console.log('Candles:', reply.length.toString(), 'candles restored');
                return cb(null, reply);
            }
        });
    };

    this.buildCandles = function (cb) {
        async.eachSeries(self.durations, function (duration, callback) {
            self.duration = duration;
            _buildCandles(callback);
        }, function (err, results) {
            if (err) {
                return cb(err);
            } else {
                return cb(null);
            }
        });
    };

    var _buildCandles = function (cb) {
        console.log('Candles:', 'Building', self.duration, 'candles for', self.name + '...');

        async.waterfall([
            function (callback) {
                client.DEL(self.candleKey(), function (err, res) {
                    if (err) {
                        return callback(err);
                    } else {
                        self.retrieveTrades(null, callback);
                    }
                });
            },
            function (results, callback) {
                self.groupTrades(results, callback);
            },
            function (results, callback) {
                self.sumTrades(results, callback);
            },
            function (results, callback) {
                self.saveCandles(results, callback);
            }
        ],
        function (err, results) {
            if (err) {
                return cb(err);
            } else {
                return cb(null, results);
            }
        });
    };

    this.updateCandles = function (cb) {
        async.eachSeries(self.durations, function (duration, callback) {
            self.duration = duration;
            _updateCandles(callback);
        }, function (err, results) {
            if (err) {
                return cb(err);
            } else {
                return cb(null);
            }
        });
    };

    var _updateCandles = function (cb) {
        console.log('Candles:', 'Updating', self.duration, 'candles for', self.name + '...');

        async.waterfall([
            function (callback) {
                client.LRANGE(self.candleKey(), -1, -1, function (err, reply) {
                    if (err) {
                        return callback(err);
                    } else if (_.size(reply) === 0) {
                        return callback('No data was found for: ' + self.name);
                    } else {
                        self.last = JSON.parse(reply);
                        return callback(null, self.last);
                    }
                });
            },
            function (reply, callback) {
                return self.retrieveTrades(reply.nextStart, callback);
            },
            function (results, callback) {
                return self.groupTrades(results, callback);
            },
            function (results, callback) {
                return self.sumTrades(results, callback);
            },
            function (results, callback) {
                return self.saveCandles(results, callback);
            }
        ],
        function (err, results) {
            if (err) {
                return cb(err);
            } else {
                return cb(null, results);
            }
        });
    };
}

module.exports = AbstractCandles;
