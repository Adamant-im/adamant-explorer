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
        'getLISKCourse'  : false
    };

    this.onInit = function () {
        async.parallel([
            getBlockStatus,
            getLISKCourse
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                data.status = res[0];
                data.course = res[1];

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

    var getLISKCourse = function (cb) {
        if (running.getLISKCourse) {
            return cb('getLISKCourse (already running)');
        }
        running.getLISKCourse = true;
        common.getLISKCourse(
            function (res) { running.getLISKCourse = false; cb('LISKCourse'); },
            function (res) { running.getLISKCourse = false; cb(null, res); }
        );
    };

    var emitData = function () {
        var thisData = {};

        async.parallel([
            getBlockStatus,
            getLISKCourse
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.status = res[0];
                thisData.course = res[1];

                data = thisData;
                log('Emitting data');
                socket.emit('data', thisData);
            }
        }.bind(this));
    };
};
