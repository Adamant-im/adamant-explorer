var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, socket) {
    var statistics = new api.statistics(app),
        clients    = 0,
        interval   = null,
        data       = {};

    this.wait = function () {
        clients = 0;
        socket.on('connection', function (socket) {
            if (clients <= 0) {
                clients = 0;
                this.emit();
            }
            clients++;
            socket.on('disconnect', function () {
                clients--;
                if (clients <= 0) {
                    clients = 0;
                    this.halt();
                }
            }.bind(this));
        }.bind(this));
    }

    this.emit = function () {
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
                getLocations();

                if (interval == null) {
                    interval = setInterval(function () {
                        this.emit();
                    }.bind(this), 30000);
                }
            }
        }.bind(this));
    }

    this.halt = function () {
        clearInterval(interval);
        interval = null;
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

    var getLocations = function (cb) {
        statistics.getLocations(
            data.peers.list.connected,
            function (res) { return false; },
            function (res) { socket.emit('locations', res); }
        );
    }
}
