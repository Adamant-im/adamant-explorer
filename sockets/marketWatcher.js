'use strict';

var api = require('../lib/api');

module.exports = function (app, connectionHandler, socket) {
    var candles    = new api.candles(app),
        connection = new connectionHandler('Market Watcher:', socket, this),
        interval   = null,
        data       = {};

    this.onInit = function () {
    };

    this.onConnect = function () {
    };

    this.onDisconnect = function () {
    };

    // Private

    var log = function (msg) {
        console.log('Market Watcher:', msg);
    };
};

