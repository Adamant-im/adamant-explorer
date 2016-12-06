'use strict';

var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var statistics = new api.statistics(app),
        connection = new connectionHandler('Network Monitor:', socket, this),
        intervals  = [],
        data       = {};

    var running = {
        'getlastBlock' : false,
        'getBlocks'    : false,
        'getPeers'     : false
    };

    this.onInit = function () {
        this.onConnect();

        async.parallel([
            getLastBlock,
            getBlocks,
            getPeers
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                data.lastBlock = res[0];
                data.blocks    = res[1];
                data.peers     = res[2];

                log('Emitting new data');
                socket.emit('data', data);

                newInterval(0, 5000, emitData1);
                // FIXME: Here we are pulling 8640 blocks - logic should be changed
                newInterval(1, 300000, emitData2);
                newInterval(2, 5000, emitData3);
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

    // Private

    var log = function (msg) {
        console.log('Network Monitor:', msg);
    };

    var newInterval = function (i, delay, cb) {
        if (intervals[i] !== undefined) {
            return null;
        } else {
            intervals[i] = setInterval(cb, delay);
            return intervals[i];
        }
    };

    var getLastBlock = function (cb) {
        if (running.getLastBlock) {
            return cb('getLastBlock (already running)');
        }
        running.getLastBlock = true;
        statistics.getLastBlock(
            function (res) { running.getLastBlock = false; cb('LastBlock'); },
            function (res) { running.getLastBlock = false; cb(null, res); }
        );
    };

    var getBlocks = function (cb) {
        if (running.getBlocks) {
            return cb('getBlocks (already running)');
        }
        running.getBlocks = true;
        statistics.getBlocks(
            function (res) { running.getBlocks = false; cb('Blocks'); },
            function (res) { running.getBlocks = false; cb(null, res); }
        );
    };

    var getPeers = function (cb) {
        if (running.getPeers) {
            return cb('getPeers (already running)');
        }
        running.getPeers = true;
        statistics.getPeers(
            function (res) { running.getPeers = false; cb('Peers'); },
            function (res) { running.getPeers = false; cb(null, res); }
        );
    };

    var emitData1 = function () {
        var thisData = {};

        async.parallel([
            getLastBlock
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.lastBlock = data.lastBlock = res[0];

                log('Emitting data-1');
                socket.emit('data1', thisData);
            }
        }.bind(this));
    };

    var emitData2 = function () {
        var thisData = {};

        async.parallel([
            getBlocks,
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.blocks = data.blocks = res[0];

                log('Emitting data-2');
                socket.emit('data2', thisData);
            }
        }.bind(this));
    };

    var emitData3 = function () {
        var thisData = {};

        async.parallel([
            getPeers
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.peers = data.peers = res[0];

                log('Emitting data-3');
                socket.emit('data3', thisData);
            }
        }.bind(this));
    };
};

