'use strict';

var api = require('../lib/api'),
    config = require('../config'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var blocks     = new api.blocks(app),
        common     = new api.common(app),
        delegates  = new api.delegates(app),
        connection = new connectionHandler('Header:', socket, this),
        intervals  = [],
        data       = {},
        tmpData    = {};

    var running = {
        'getBlockStatus'       : false,
        'getPriceTicker'       : false,
        'getDelegateProposals' : false
    };

    this.onInit = function () {
        this.onConnect(); // Prevents data wipe

        async.parallel([
            getBlockStatus,
            getPriceTicker
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                data.status = res[0];
                data.ticker = res[1];

                log('Emitting new data');
                socket.emit('data', data);

                newInterval(0, 10000, emitData);
                // Update and emit delegate proposals every 10 minutes by default
                newInterval(1, config.proposals.updateInterval || 600000, emitDelegateProposals);
            }
        }.bind(this));

        emitDelegateProposals ();
    };

    this.onConnect = function () {
        log ('Emitting existing delegate proposals');
        socket.emit ('delegateProposals', tmpData.proposals);

        log('Emitting existing data');
        socket.emit('data', data);
    };

    this.onDisconnect = function () {
        for (var i = 0; i < intervals.length; i++) {
            clearInterval(intervals[i]);
        }
        intervals = [];
    };

    // Private

    var log = function (msg) {
        console.log('Header:', msg);
    };

    var newInterval = function (i, delay, cb) {
        if (intervals[i] !== undefined) {
            return null;
        } else {
            intervals[i] = setInterval(cb, delay);
            return intervals[i];
        }
    };

    var getBlockStatus = function (cb) {
        if (running.getBlockStatus) {
            return cb('getBlockStatus (already running)');
        }
        running.getBlockStatus = true;
        blocks.getBlockStatus(
            function (res) { running.getBlockStatus = false; cb('Status'); },
            function (res) { running.getBlockStatus = false; cb(null, res); }
        );
    };

    var getPriceTicker = function (cb) {
        if (running.getPriceTicker) {
            return cb('getPriceTicker (already running)');
        }
        running.getPriceTicker = true;
        common.getPriceTicker(
            function (res) { running.getPriceTicker = false; cb('PriceTicker'); },
            function (res) { running.getPriceTicker = false; cb(null, res); }
        );
    };

    var getDelegateProposals = function (cb) {
        if (running.getDelegateProposals) {
            return cb ('getDelegateProposals (already running)');
        }
        running.getDelegateProposals = true;
        return delegates.getDelegateProposals (
            function (res) { running.getDelegateProposals = false; cb ('DelegateProposals'); },
            function (res) { running.getDelegateProposals = false; cb (null, res); }
        );
    };

    var emitData = function () {
        var thisData = {};

        async.parallel([
            getBlockStatus,
            getPriceTicker
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.status = res[0];
                thisData.ticker = res[1];

                data = thisData;
                log('Emitting data');
                socket.emit('data', thisData);
            }
        }.bind(this));
    };

    var emitDelegateProposals = function () {
        if (!config.proposals.enabled) {
            return false;
        }
        
        async.parallel ([
            getDelegateProposals
        ],
        function (err, res) {
            if (err) {
                log ('Error retrieving: ' + err);
            } else {
                tmpData.proposals = res[0];
            }

            log ('Emitting updated delegate proposals');
            socket.emit ('delegateProposals', tmpData.proposals);
        });
    };
};
