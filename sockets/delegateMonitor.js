var api = require('../lib/api'),
    async = require('async');

module.exports = function (app, connectionHandler, socket) {
    var delegates  = new api.delegates(app),
        connection = new connectionHandler('Delegate Monitor:', socket, this),
        interval   = null,
        data       = {};

    var running = {
        'getActive'        : false,
        'getLastBlock'     : false,
        'getRegistrations' : false,
        'getVotes'         : false
    };

    this.onInit = function () {
        async.parallel([
            getActive,
            getLastBlock,
            getRegistrations,
            getVotes
        ],
        function (err, res) {
            if (err) {
                log('Error retrieving: ' + err);
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
        if (running.getActive) {
            return cb('getActive (already running)');
        }
        running.getActive = true;
        delegates.getActive(
            function (res) { running.getActive = false; cb('Active') },
            function (res) { running.getActive = false; cb(null, res) }
        );
    }

    var getLastBlock = function (cb) {
        if (running.getLastBlock) {
            return cb('getLastBlock (already running)');
        }
        running.getLastBlock = true;
        delegates.getLastBlock(
            function (res) { running.getLastBlock = false; cb('LastBlock') },
            function (res) { running.getLastBlock = false; cb(null, res) }
        );
    }

    var getRegistrations = function (cb) {
        if (running.getRegistrations) {
            return cb('getRegistrations (already running)');
        }
        running.getRegistrations = true;
        delegates.getLatestRegistrations(
            function (res) { running.getRegistrations = false; cb('Registrations') },
            function (res) { running.getRegistrations = false; cb(null, res) }
        );
    }

    var getVotes = function (cb) {
        if (running.getVotes) {
            return cb('getVotes (already running)');
        }
        running.getVotes = true;
        delegates.getLatestVotes(
            function (res) { running.getVotes = false; cb('Votes') },
            function (res) { running.getVotes = false; cb(null, res) }
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
                log('Error retrieving: ' + err);
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
