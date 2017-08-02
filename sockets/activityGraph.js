'use strict';

var api = require('../lib/api');
var logger = require('../utils/logger');

module.exports = function (app, connectionHandler, socket) {
    var statistics   = new api.statistics(app),
        transactions = new api.transactions(app),
        connection   = new connectionHandler('Activity Graph:', socket, this),
        running      = { 'getlastBlock' : false },
        interval     = null,
        data         = {};

    this.onInit = function () {
        emitLastBlock();

        if (interval == null) {
            interval = setInterval(emitLastBlock, 10000);
        }
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

    var log = function (level, msg) {
        logger[level]('Activity Graph:', msg);
    };

    var getLastBlock = function (cb) {
        if (running.getLastBlock) {
            return cb('getLastBlock (already running)');
        }
        running.getLastBlock = true;
        statistics.getLastBlock(
            function (res) { running.getLastBlock = false; cb('LastBlock'); },
            function (res) {
                if (res.success && res.block.numberOfTransactions > 0) {
                    getBlockTransactions(res, cb);
                } else {
                    running.getLastBlock = false;
                    cb(null, res);
                }
            }
        );
    };

    var getBlockTransactions = function (resBlock, cb) {
        transactions.getTransactionsByBlock(
            { blockId : resBlock.block.id,
              offset  : 0,
              limit   : 100 },
            function (res) {
                running.getLastBlock = false;
                cb('BlockTransactions');
            },
            function (res) {
                if (res.success) {
                    resBlock.block.transactions = res.transactions;
                } else {
                    resBlock.block.transactions = [];
                }
                running.getLastBlock = false;
                cb(null, resBlock);
            }
        );
    };

    var newLastBlock = function (res) {
        return res.success && (data.block == null) || (res.block.height > data.block.height);
    };

    var emitLastBlock = function () {
        getLastBlock(function (err, res) {
            if (err) {
                log('error','Error retrieving: ' + err);
            } else if (newLastBlock(res)) {
                data = res;
            }
            log('info','Emitting new data');
            socket.emit('data', data);
        });
    };
};
