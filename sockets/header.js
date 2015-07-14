var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var blocks     = new api.blocks(app),
        common     = new api.common(app),
        connection = new connectionHandler('Header:', socket, this),
        interval   = null,
        data       = {};

    this.onInit = function () {
        async.parallel([
            getBlocksCount,
            getFee,
            getXCRCourse
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                data.blocks = res[0];
                data.fee    = res[1];
                data.course = res[2];

                log('Emitting new data');
                socket.emit('data', data);

                if (interval == null) {
                    interval = setInterval(emitData, 10000);
                }
            }
        }.bind(this))
    }

    this.onConnect = function () {
        log('Emitting existing data');
        socket.emit('data', data);
    }

    this.onDisconnect = function () {
        clearInterval(interval);
        interval = null;
        data     = {};
    }

    // Private

    var log = function (msg) {
        console.log('Header:', msg);
    }

    var getBlocksCount = function (cb) {
        blocks.getBlocksCount(
            function (res) { cb('BlocksCount') },
            function (res) { cb(null, res) }
        );
    }

    var getFee = function (cb) {
        common.getFee(
            function (res) { cb('Fee') },
            function (res) { cb(null, res) }
        );
    }

    var getXCRCourse = function (cb) {
        common.getXCRCourse(
            function (res) { cb('XCRCourse') },
            function (res) { cb(null, res) }
        );
    }

    var emitData = function () {
        var thisData = {};

        async.parallel([
            getBlocksCount,
            getFee,
            getXCRCourse
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
            } else {
                thisData.blocks = res[0];
                thisData.fee    = res[1];
                thisData.course = res[2];

                data = thisData;
                log('Emitting data');
                socket.emit('data', thisData);
            }
        }.bind(this));
    }
}
