var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, socket) {
    var statistics = new api.statistics(app),
        interval   = 0,
        data       = {};

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
                intervalOn(this);
                getLocations();
            }
        }.bind(this));
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

    var intervalOn = function (self) {
        if (interval == 0) {
            interval = 5000;
            setInterval(function () {
                self.emit();
            }, interval);
        }
    }
}
