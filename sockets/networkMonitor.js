var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var statistics = new api.statistics(app),
        connection = new connectionHandler('Network Monitor:', socket, this),
        intervals  = [],
        data       = {};

    this.onInit = function () {
        async.parallel([
            getLastBlock,
            getBlocks,
            getPeers
        ],
        function (err, res) {
            if (err) {
                log('Error in retrieving data for: ' + err);
            } else {
                data.lastBlock = res[0];
                data.blocks    = res[1];
                data.peers     = res[2];

                log('Emitting new data');
                socket.emit('data', data);

                newInterval(0, 10000, emitData1);
                newInterval(1, 30000, emitData2);
                newInterval(2, 60000, emitData3);
            }
        }.bind(this));
    }

    this.onConnect = function () {
        log('Emitting existing data');
        socket.emit('data', data);
    }

    this.onDisconnect = function () {
        for (var i = 0; i < intervals.length; i++) {
            clearInterval(intervals[i]);
        }
        intervals = [];
        data      = {};
    }

    // Private

    var log = function (msg) {
        console.log('Network Monitor:', msg);
    }

    var newInterval = function (i, delay, cb) {
        if (intervals[i] !== undefined) {
            return null;
        } else {
            return intervals[i] = setInterval(cb, delay);
        }
    }

    var getLastBlock = function (cb) {
        statistics.getLastBlock(
            function (res) { cb('LastBlock') },
            function (res) { cb(null, res) }
        );
    }

    var getBlocks = function (cb) {
        statistics.getBlocks(
            function (res) { cb('Blocks') },
            function (res) { cb(null, res) }
        );
    }

    var getPeers = function (cb) {
        statistics.getPeers(
            function (res) { cb('Peers') },
            function (res) { cb(null, res) }
        );
    }

    var emitData1 = function () {
        var thisData = {};

        async.parallel([
            getLastBlock
        ],
        function (err, res) {
            if (err) {
                log('Error in retrieving data for: ' + err);
            } else {
                thisData.lastBlock = data.lastBlock = res[0];

                log('Emitting data-1');
                socket.emit('data1', thisData);
            }
        }.bind(this));
    }

    var emitData2 = function () {
        var thisData = {};

        async.parallel([
            getBlocks,
        ],
        function (err, res) {
            if (err) {
                log('Error in retrieving data for: ' + err);
            } else {
                thisData.blocks = data.blocks = res[0];

                log('Emitting data-2');
                socket.emit('data2', thisData);
            }
        }.bind(this));
    }

    var emitData3 = function () {
        var thisData = {};

        async.parallel([
            getPeers
        ],
        function (err, res) {
            if (err) {
                log('Error in retrieving data for: ' + err);
            } else {
                thisData.peers = data.peers = res[0];

                log('Emitting data-3');
                socket.emit('data3', thisData);
            }
        }.bind(this));
    }
}
