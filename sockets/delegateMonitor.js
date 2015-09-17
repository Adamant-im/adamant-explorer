'use strict';

var api = require('../lib/api'),
    moment = require('moment'),
    _ = require('underscore'),
    async = require('async');

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
        'getLastBlocks'    : false
    };

    this.onInit = function () {
        this.onConnect();

        async.parallel([
            getActive,
            getLastBlock,
            getRegistrations,
            getVotes
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                data.active        = updateActive(res[0]);
                data.lastBlock     = res[1];
                data.registrations = res[2];
                data.votes         = res[3];

                log('Emitting new data');
                socket.emit('data', data);

                if (interval == null) {
                    interval = setInterval(emitData, 10000);
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

    var updateActive = function (results) {
        if (!data.active || !data.active.delegates) {
            return results;
        } else {
            _.each(results.delegates, function (delegate) {
                var existing = findActive(delegate);

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

    var getLastBlocks = function (results) {
        if (running.getLastBlocks) {
            return log('getLastBlocks (already running)');
        }
        running.getLastBlocks = true;
        async.eachSeries(results.delegates, function (delegate, callback) {
            if (delegate.blocksAt) {
                var minutesAgo = moment().diff(delegate.blocksAt, 'minutes');

                if (minutesAgo <= 9) {
                    log('Skipping last blocks for: ' + delegateName(delegate));
                    log('Checked ' + minutesAgo + ' minutes ago...');
                    emitDelegate(delegate);
                    return callback(null);
                }
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

                    emitDelegate(delegate);

                    if (interval) {
                        callback(null);
                    } else {
                        callback('Monitor closed');
                    }
                }
            );
        }, function (err) {
            if (err) {
                log('Error retrieving LastBlocks: ' + err);
            }
            running.getLastBlocks = false;
        });
    };

    var delegateName = function (delegate) {
        return delegate.username + '[' + delegate.rate + ']';
    };

    var emitData = function () {
        var thisData = {};

        async.parallel([
            getActive,
            getLastBlock,
            getRegistrations,
            getVotes
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.active        = updateActive(res[0]);
                thisData.lastBlock     = res[1];
                thisData.registrations = res[2];
                thisData.votes         = res[3];

                data = thisData;
                log('Emitting data');
                socket.emit('data', thisData);
                getLastBlocks(thisData.active);
            }
        }.bind(this));
    };

    var emitDelegate = function (delegate) {
        log('Emitting last blocks for: ' + delegateName(delegate));
        socket.emit('delegate', delegate);
    };
};
