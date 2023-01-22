'use strict';

const blocksHandler = require('../api/lib/adamant/handlers/blocks');
const commonHandler = require('../api/lib/adamant/handlers/common');
const async = require('async');
const logger = require('../utils/log');

module.exports = function (app, connectionHandler, socket) {
  let intervals = [];
  let data = {};
  let tmpData = {};
  const connection = new connectionHandler('Header: ', socket, this);

  const running = {
    'getBlockStatus': false,
    'getPriceTicker': false,
    'getDelegateProposals': false,
  };

  this.onInit = function () {
    this.onConnect(); // Prevents data wipe

    async.parallel([
        getBlockStatus,
        getPriceTicker,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          data.status = res[0];
          data.ticker = res[1];

          log('info', 'Emitting new data');
          socket.emit('data', data);

          newInterval(0, 10000, emitData);
        }
      }.bind(this));

  };

  this.onConnect = function () {
    log('info', 'Emitting existing delegate proposals');
    socket.emit('delegateProposals', tmpData.proposals);

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
    logger[level]('Header: ' + msg);
  };

  const newInterval = function (i, delay, cb) {
    if (intervals[i] !== undefined) {
      return null;
    } else {
      intervals[i] = setInterval(cb, delay);
      return intervals[i];
    }
  };

  const getBlockStatus = function (cb) {
    if (running.getBlockStatus) {
      return cb('getBlockStatus (already running)');
    }
    running.getBlockStatus = true;
    blocksHandler.getBlockStatus(
      (res) => {
        running.getBlockStatus = false;
        cb('Status');
      },
      (res) => {
        running.getBlockStatus = false;
        cb(null, res);
      },
    );
  };

  const getPriceTicker = function (cb) {
    if (running.getPriceTicker) {
      return cb('getPriceTicker (already running)');
    }
    running.getPriceTicker = true;
    commonHandler.getPriceTicker(
      app.get('exchange enabled'),
      app.exchange,
      (res) => {
        running.getPriceTicker = false;
        cb('PriceTicker');
      },
      (res) => {
        running.getPriceTicker = false;
        cb(null, res);
      },
    );
  };

  const emitData = function () {
    const thisData = {};

    async.parallel([
        getBlockStatus,
        getPriceTicker,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          thisData.status = res[0];
          thisData.ticker = res[1];

          data = thisData;
          log('info', 'Emitting data');
          socket.emit('data', thisData);
        }
      }.bind(this));
  };
};
