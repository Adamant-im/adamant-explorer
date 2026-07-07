const blocksHandler = require('../api/lib/adamant/handlers/blocks');
const commonHandler = require('../api/lib/adamant/handlers/common');
const async = require('async');
const logger = require('../utils/log');

/**
 * Header socket namespace. Periodically emits the network status
 * and exchange rates shown in the page header.
 * @param {Object} app Express application
 * @param {Function} connectionHandler Shared socket connection life cycle handler
 * @param {Object} socket Socket.IO namespace
 */
module.exports = function (app, connectionHandler, socket) {
  let intervals = [];
  let data = {};

  new connectionHandler('Header:', socket, this);

  const running = {
    getBlockStatus: false,
    getPriceTicker: false,
  };

  this.onInit = function () {
    this.onConnect(); // Prevents data wipe

    async.parallel(
      [getBlockStatus, getPriceTicker],
      function (err, res) {
        if (err) {
          // A failed request must not leave the header empty forever:
          // retry until the initial data set is collected
          log('error', 'Error retrieving: ' + err + '. Retrying in 10 seconds');
          setTimeout(() => this.onInit(), 10000);
        } else {
          data.status = res[0];
          data.ticker = res[1];

          log('info', 'Emitting new data');
          socket.emit('data', data);

          newInterval(0, 10000, emitData);
        }
      }.bind(this),
    );
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

    async.parallel(
      [getBlockStatus, getPriceTicker],
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
      }.bind(this),
    );
  };
};
