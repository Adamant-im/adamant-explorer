'use strict';

const api = require('../lib/api');
const async = require('async');
const logger = require('../utils/logger');

module.exports = function (app, connectionHandler, socket) {
  let data = {};
  let intervals = [];
  const statistics = new api.statistics(app);
  const connection = new connectionHandler('Network Monitor:', socket, this);

  const running = {
    'getlastBlock': false,
    'getBlocks': false,
    'getPeers': false,
  };

  this.onInit = function () {
    this.onConnect();

    async.parallel([
        getLastBlock,
        getBlocks,
        getPeers,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          data.lastBlock = res[0];
          data.blocks = res[1];
          data.peers = res[2];

          log('info', 'Emitting new data');
          socket.emit('data', data);

          newInterval(0, 5000, emitData1);
          // FIXME: Here we are pulling 8640 blocks - logic should be changed
          newInterval(1, 300000, emitData2);
          newInterval(2, 5000, emitData3);
        }
      }.bind(this));
  };

  this.onConnect = function () {
    log('info', 'Emitting existing data');
    socket.emit('data', data);
  };

  this.onDisconnect = function () {
    for (let i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }
    intervals = [];
  };

  // Private

  const log = function (level, msg) {
    logger[level]('Network Monitor:', msg);
  };

  const newInterval = function (i, delay, cb) {
    if (intervals[i] !== undefined) {
      return null;
    } else {
      intervals[i] = setInterval(cb, delay);
      return intervals[i];
    }
  };

  const getLastBlock = function (cb) {
    if (running.getLastBlock) {
      return cb('getLastBlock (already running)');
    }
    running.getLastBlock = true;
    statistics.getLastBlock(
      (res) => {
        running.getLastBlock = false;
        cb('LastBlock');
      },
      (res) => {
        running.getLastBlock = false;
        cb(null, res);
      },
    );
  };

  const getBlocks = function (cb) {
    if (running.getBlocks) {
      return cb('getBlocks (already running)');
    }
    running.getBlocks = true;
    statistics.getBlocks(
      (res) => {
        running.getBlocks = false;
        cb('Blocks');
      },
      (res) => {
        running.getBlocks = false;
        cb(null, res);
      },
    );
  };

  const getPeers = function (cb) {
    if (running.getPeers) {
      return cb('getPeers (already running)');
    }
    running.getPeers = true;
    statistics.getPeers(
      (res) => {
        running.getPeers = false;
        cb('Peers');
      },
      (res) => {
        running.getPeers = false;
        cb(null, res);
      },
    );
  };

  const emitData1 = function () {
    const thisData = {};

    async.parallel([
        getLastBlock,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          thisData.lastBlock = data.lastBlock = res[0];

          log('info', 'Emitting data-1');
          socket.emit('data1', thisData);
        }
      }.bind(this));
  };

  const emitData2 = function () {
    const thisData = {};

    async.parallel([
        getBlocks,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          thisData.blocks = data.blocks = res[0];

          log('info', 'Emitting data-2');
          socket.emit('data2', thisData);
        }
      }.bind(this));
  };

  const emitData3 = function () {
    const thisData = {};

    async.parallel([
        getPeers,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          thisData.peers = data.peers = res[0];

          log('info', 'Emitting data-3');
          socket.emit('data3', thisData);
        }
      }.bind(this));
  };
};

