var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var delegates  = new api.delegates(app),
        connection = new connectionHandler('Delegate Monitor:', socket, this),
        interval   = null,
        data       = {};

    this.onInit = function () {
        async.parallel([
            getActive,
            getLastBlock,
            getRegistrations,
            getVotes
        ],
        function (err, res) {
            if (err) {
                log('Error in retrieving data for: ' + err);
            } else {
                data.active        = res[0];
                data.lastBlock     = res[1];
                data.registrations = res[2];
                data.votes         = res[3];

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
        console.log('Delegate Monitor:', msg);
    }

    var getActive = function (cb) {
        delegates.getActive(
            function (res) { cb('Active') },
            function (res) { cb(null, res) }
        );
    }

    var getLastBlock = function (cb) {
        delegates.getLastBlock(
            function (res) { cb('LastBlock') },
            function (res) { cb(null, res) }
        );
    }

    var getRegistrations = function (cb) {
        delegates.getLatestRegistrations(
            function (res) { cb('Registrations') },
            function (res) { cb(null, res) }
        );
    }

    var getVotes = function (cb) {
        delegates.getLatestVotes(
            function (res) { cb('Votes') },
            function (res) { cb(null, res) }
        );
    }

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
                log('Error in retrieving data for: ' + err);
            } else {
                thisData.active        = res[0];
                thisData.lastBlock     = res[1];
                thisData.registrations = res[2];
                thisData.votes         = res[3];

                data = thisData;
                log('Emitting data');
                socket.emit('data', thisData);
            }
        }.bind(this));
    }
}
