var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var statistics = new api.statistics(app),
        connection = new connectionHandler(socket, this),
        intervals  = [],
        data       = {};

    this.onInit = function () {
        async.parallel([
            getBestBlock,
            getLastBlock,
            getVolume,
            getPeers
        ],
        function (err, res) {
            if (err) {
                console.log('Error in retrieving statistics for: ' + err);
            } else {
                data.bestBlock = res[0];
                data.lastBlock = res[1];
                data.volume    = res[2];
                data.peers     = res[3];

                socket.emit('data', data);

                newInterval(0, 10000, emitData1);
                newInterval(1, 30000, emitData2);
                newInterval(2, 60000, emitData3);
            }
        }.bind(this));
    }

    this.onConnect = function () {
        socket.emit('data', data);
    }

    this.onDisconnect = function () {
        for (var i = 0; i < intervals.length; i++) {
            clearInterval(intervals[i]);
        }
        intervals = [];
        data      = {};
    }

    var newInterval = function (i, delay, cb) {
        if (intervals[i] !== undefined) {
            return null;
        } else {
            return intervals[i] = setInterval(cb, delay);
        }
    }

    var getBestBlock = function (cb) {
        statistics.getBestBlock(
            function (res) { cb('BestBlock') },
            function (res) { cb(null, res) }
        );
    }

    var getLastBlock = function (cb) {
        statistics.getLastBlock(
            function (res) { cb('LastBlock') },
            function (res) { cb(null, res) }
        );
    }

    var getVolume = function (cb) {
        statistics.getVolume(
            function (res) { cb('Volume') },
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
                console.log('Error in retrieving statistics for: ' + err);
            } else {
                thisData.lastBlock = data.lastBlock = res[0];
                socket.emit('data1', thisData);
            }
        }.bind(this));
    }

    var emitData2 = function () {
        var thisData = {};

        async.parallel([
            getBestBlock,
            getVolume
        ],
        function (err, res) {
            if (err) {
                console.log('Error in retrieving statistics for: ' + err);
            } else {
                thisData.bestBlock = data.bestBlock = res[0];
                thisData.volume    = data.volume    = res[1];
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
                console.log('Error in retrieving statistics for: ' + err);
            } else {
                thisData.peers = data.peers = res[0];
                socket.emit('data3', thisData);
            }
        }.bind(this));
    }
}
