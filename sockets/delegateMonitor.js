'use strict';

var api = require('../lib/api'),
    moment = require('moment'),
    _ = require('underscore'),
    async = require('async'),
    request = require('request');

module.exports = function (app, connectionHandler, socket) {
    var delegates  = new api.delegates(app),
        connection = new connectionHandler('Delegate Monitor:', socket, this),
        intervals  = [],
        data       = {},
        // Only used in various calculations, will not be emited directly
        tmpData    = {};

    var running = {
        'getActive'        : false,
        'getLastBlock'     : false,
        'getRegistrations' : false,
        'getVotes'         : false,
        'getLastBlocks'    : false,
        'getNextForgers'   : false
    };

    this.onInit = function () {
        this.onConnect();

        async.parallel([
            // We only call getLastBlock on init, later data.lastBlock will be updated from getLastBlocks
            getLastBlock,
            getActive,
            getRegistrations,
            getVotes,
            getNextForgers
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                tmpData.nextForgers = res[4];

                data.lastBlock      = res[0];
                data.active         = updateActive(res[1]);
                data.registrations  = res[2];
                data.votes          = res[3];
                data.nextForgers    = cutNextForgers (10);

                log('Emitting new data');
                socket.emit('data', data);

                getLastBlocks(data.active, true);

                newInterval(0, 5000, emitData);
                newInterval(1, 1000, getLastBlocks);
            }
        }.bind(this));
    };

    this.onConnect = function () {
        log('Emitting existing data');
        socket.emit('data', data);
    };

    this.onDisconnect = function () {
        for (var i = 0; i < intervals.length; i++) {
            clearInterval(intervals[i]);
        }
        intervals = [];
    };

    var newInterval = function (i, delay, cb) {
        if (intervals[i] !== undefined) {
            return null;
        } else {
            intervals[i] = setInterval(cb, delay);
            return intervals[i];
        }
    };

    // Private

    var log = function (msg) {
        console.log('Delegate Monitor:', msg);
    };

    var cutNextForgers = function (count) {
        var data = tmpData.nextForgers.delegates.slice(0, 10);

        _.each(data, function (publicKey, index) {
            var existing = findActiveByPublicKey(publicKey);
            data[index] = existing;
        });

        return data;
    };

    var getActive = function (cb) {
        if (running.getActive) {
            return cb('getActive (already running)');
        }
        running.getActive = true;
        delegates.getActive(
            function (res) { running.getActive = false; cb('Active'); },
            function (res) { running.getActive = false; cb(null, res); }
        );
    };

    var findActive = function (delegate) {
        return _.find(data.active.delegates, function (d) {
            return d.publicKey === delegate.publicKey;
        });
    };

    var findActiveByPublicKey = function (publicKey) {
        return _.find(data.active.delegates, function (d) {
            return d.publicKey === publicKey;
        });
    };

    var findActiveByBlock = function (block) {
        return _.find(data.active.delegates, function (d) {
            return d.publicKey === block.generatorPublicKey;
        });
    };

    var updateDelegate = function (delegate, updateForgingTime) {
        // Update delegate with forging time
        if (updateForgingTime) {
            delegate.forgingTime = tmpData.nextForgers.delegates.indexOf(delegate.publicKey) * 10;
        }

        // Update delegate with info if should forge in current round
        if (tmpData.roundDelegates.indexOf(delegate.publicKey) === -1) {
            delegate.isRoundDelegate = false;
        } else {
            delegate.isRoundDelegate = true;
        }
        return delegate;
    };

    var updateActive = function (results) {
        // Calculate list of delegates that should forge in current round
        tmpData.roundDelegates = getRoundDelegates(tmpData.nextForgers.delegates, data.lastBlock.block.height);

        if (!data.active || !data.active.delegates) {
            return results;
        } else {
            _.each(results.delegates, function (delegate) {
                var existing = findActive(delegate);

                if (existing) {
                    delegate = updateDelegate (delegate, true);
                }

                if (existing && existing.blocks && existing.blocksAt) {
                    delegate.blocks = existing.blocks;
                    delegate.blocksAt = existing.blocksAt;
                }
            });

            return results;
        }
    };

    var getLastBlock = function (cb) {
        if (running.getLastBlock) {
            return cb('getLastBlock (already running)');
        }
        running.getLastBlock = true;
        delegates.getLastBlock(
            function (res) { running.getLastBlock = false; cb('LastBlock'); },
            function (res) { running.getLastBlock = false; cb(null, res); }
        );
    };

    var getRegistrations = function (cb) {
        if (running.getRegistrations) {
            return cb('getRegistrations (already running)');
        }
        running.getRegistrations = true;
        delegates.getLatestRegistrations(
            function (res) { running.getRegistrations = false; cb('Registrations'); },
            function (res) { running.getRegistrations = false; cb(null, res); }
        );
    };

    var getVotes = function (cb) {
        if (running.getVotes) {
            return cb('getVotes (already running)');
        }
        running.getVotes = true;
        delegates.getLatestVotes(
            function (res) { running.getVotes = false; cb('Votes'); },
            function (res) { running.getVotes = false; cb(null, res); }
        );
    };

    var getNextForgers = function (cb) {
        if (running.getNextForgers) {
            return cb('getNextForgers (already running)');
        }
        running.getNextForgers = true;
        delegates.getNextForgers(
            function (res) { running.getNextForgers = false; cb('NextForgers'); },
            function (res) { running.getNextForgers = false; cb(null, res); }
        );
    };

    var getLastBlocks = function (init) {
        var limit = init ? 100 : 2;

        if (running.getLastBlocks) {
            return log('getLastBlocks (already running)');
        }
        running.getLastBlocks = true;

        async.waterfall([
            function (callback) {
                request.get({
                    url : app.get('lisk address') + '/api/blocks?orderBy=height:desc&limit=' + limit,
                    json : true
                }, function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return callback((err || 'Response was unsuccessful'));
                    } else if (body.success === true) {
                        return callback(null, { blocks: body.blocks });
                    } else {
                        return callback(body.error);
                    }
                });
            },
            function (result, callback) {
                // Set last block and his delegate (we will emit it later in emitData)
                data.lastBlock.block = _.first (result.blocks);
                var lb_delegate = findActiveByBlock(data.lastBlock.block);
                data.lastBlock.block.delegate = {
                    username: lb_delegate.username,
                    address: lb_delegate.address,
                };

                async.eachSeries(result.blocks, function (b, cb) {
                   var existing = findActiveByBlock(b);

                    if (existing) {
                        if (!existing.blocks || existing.blocks[0].timestamp < b.timestamp) {
                            existing.blocks = [];
                            existing.blocks.push(b);
                            existing.blocksAt = moment();
                            existing = updateDelegate (existing, false);
                            emitDelegate(existing);
                        }
                    }

                    if (intervals[1]) {
                        cb(null);
                    } else {
                        callback('Monitor closed');
                    }
                }, function (err) {
                    if (err) {
                        callback (err, result);
                    }
                    callback (null, result);
                });
            },
            function (result, callback) {
                async.eachSeries(data.active.delegates, function (delegate, cb) {
                    if (delegate.blocks) {
                            return cb(null);
                    }
                    delegates.getLastBlocks(
                        { publicKey : delegate.publicKey,
                          limit : 1 },
                        function (res) {
                            log('Error retrieving last blocks for: ' + delegateName(delegate));
                            callback(res.error);
                        },
                        function (res) {
                            var existing = findActive(delegate);

                            if (existing) {
                                existing.blocks = res.blocks;
                                existing.blocksAt = moment();
                                existing = updateDelegate (existing, false);
                                emitDelegate(existing);
                            }

                            if (intervals[1]) {
                                cb(null);
                            } else {
                                callback('Monitor closed');
                            }
                        }
                    );
                }, function (err) {
                    if (err) {
                        callback (err, result);
                    }
                    callback (null, result);
                });
            }
        ], function (err, callback) {
            if (err) {
                log('Error retrieving LastBlocks: ' + err);
            }
            running.getLastBlocks = false;
        });
    };

    var getRound = function (height) {
        return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0);
    };

    var getRoundDelegates = function (delegates, height) {
       var currentRound = getRound (height);

       var filtered = delegates.filter(function (delegate, index) {
            return currentRound === getRound (height + index + 1);
       });

       return filtered;
    };

    var delegateName = function (delegate) {
        return delegate.username + '[' + delegate.rate + ']';
    };

    var emitData = function () {
        async.parallel([
            getActive,
            getRegistrations,
            getVotes,
            getNextForgers
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                tmpData.nextForgers = res[3];

                data.active         = updateActive(res[0]);
                data.registrations  = res[1];
                data.votes          = res[2];
                data.nextForgers    = cutNextForgers(10);

                log('Emitting data');
                socket.emit('data', data);
            }
        }.bind(this));
    };

    var emitDelegate = function (delegate) {
        log('Emitting last blocks for: ' + delegateName(delegate));
        socket.emit('delegate', delegate);
    };
};
