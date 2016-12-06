'use strict';

var api = require('../lib/api'),
    moment = require('moment'),
    _ = require('underscore'),
    async = require('async'),
    request = require('request');

module.exports = function (app, connectionHandler, socket) {
    var delegates  = new api.delegates(app),
        connection = new connectionHandler('Delegate Monitor:', socket, this),
        interval   = null,
        data       = {};

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
            getActive,
            getLastBlock,
            getRegistrations,
            getVotes,
            getNextForgers
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                data.active         = updateActive(res[0], res[4], res[1]);
                data.lastBlock      = res[1];
                data.registrations  = res[2];
                data.votes          = res[3];
                data.nextForgers    = res[4].delegates.slice(0, 10);

                _.each(data.nextForgers, function (publicKey, index) {
                    var existing = findActiveByPublicKey(publicKey);
                    data.nextForgers[index] = existing;
                });

                log('Emitting new data');
                socket.emit('data', data);

                getLastBlocks(data.active, true);

                if (interval == null) {
                    interval = setInterval(emitData, 5000);
                }
            }
        }.bind(this));
    };

    this.onConnect = function () {
        log('Emitting existing data');
        socket.emit('data', data);
    };

    this.onDisconnect = function () {
        clearInterval(interval);
        interval = null;
    };

    // Private

    var log = function (msg) {
        console.log('Delegate Monitor:', msg);
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

    var updateActive = function (results, nextForgers, lastBlock) {
        // Calculate list of delegates that should forge in current round
        var roundDelegates = getRoundDelegates(nextForgers.delegates, lastBlock.block.height)

        if (!data.active || !data.active.delegates) {
            return results;
        } else {
            _.each(results.delegates, function (delegate) {
                var existing = findActive(delegate);

                if (existing) {
                    // Update delegate with forging time
                    delegate.forgingTime = nextForgers.delegates.indexOf(existing.publicKey) * 10;

                    // Update delegate with info if should forge in current round
                    if (roundDelegates.indexOf(existing.publicKey) === -1) {
                        delegate.isRoundDelegate = false;
                    } else {
                        delegate.isRoundDelegate = true;
                    }
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

    var getLastBlocks = function (results, init) {
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
                        return error({ success : false, error : (err || 'Response was unsuccessful') });
                    } else if (body.success === true) {
                        return callback(null, { blocks: body.blocks });
                    } else {
                        return error({ success : false, error : body.error });
                    }
                });
            },
            function (result, callback) {
                    async.eachSeries(result.blocks, function (b, cb) {
                       var existing = findActiveByBlock(b);

                        if (existing) {
                            if (!existing.blocks || existing.blocks[0].timestamp < b.timestamp) {
                                existing.blocks = [];
                                existing.blocks.push(b);
                                existing.blocksAt = moment();
                                emitDelegate(existing);
                            }
                        }

                        if (interval) {
                            cb(null);
                        } else {
                            cb('Monitor closed');
                        }
                    }, function (err) {
                        if (err) {
                            cb (err, result);
                        }
                        callback (null, result);
                    });
            },
            function (result, callback) {
                async.eachSeries(results.delegates, function (delegate, cb) {
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
                            }

                            emitDelegate(existing);

                            if (interval) {
                                cb(null);
                            } else {
                                callback('Monitor closed');
                            }
                        }
                    );
                }, function (err) {
                    if (err) {
                        cb (err, result);
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
    }

    var getRoundDelegates = function (delegates, height) {
       var currentRound = getRound (height);

       var filtered = delegates.filter(function (delegate, index) {
            return currentRound === getRound (height + index + 1);
       });
       
       return filtered;
    }

    var delegateName = function (delegate) {
        return delegate.username + '[' + delegate.rate + ']';
    };

    var emitData = function () {
        var thisData = {};

        async.parallel([
            getActive,
            getLastBlock,
            getRegistrations,
            getVotes,
            getNextForgers
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.active         = updateActive(res[0], res[4], res[1]);
                thisData.lastBlock      = res[1];
                thisData.registrations  = res[2];
                thisData.votes          = res[3];
                thisData.nextForgers    = res[4].delegates.slice(0, 10);

                _.each(thisData.nextForgers, function (publicKey, index) {
                    var existing = findActiveByPublicKey(publicKey);
                    thisData.nextForgers[index] = existing;
                });

                data = thisData;
                log('Emitting data');
                socket.emit('data', thisData);
                getLastBlocks(thisData.active, false);
            }
        }.bind(this));
    };

    var emitDelegate = function (delegate) {
        log('Emitting last blocks for: ' + delegateName(delegate));
        socket.emit('delegate', delegate);
    };
};
