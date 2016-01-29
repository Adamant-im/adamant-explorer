'use strict';

var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var blocks     = new api.blocks(app),
        common     = new api.common(app),
        connection = new connectionHandler('Header:', socket, this),
        interval   = null,
        data       = {};

    var running = {
        'getBlockStatus' : false,
        'getPriceTicker' : false
    };

    this.onInit = function () {
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
        data     = {};
    };

    // Private

    var log = function (msg) {
        console.log('Header:', msg);
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
};
