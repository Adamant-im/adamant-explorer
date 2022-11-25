'use strict';

const api = require('../lib/api');
const config = require('../config');
const async = require('async');
const logger = require('../utils/logger');

module.exports = function (app, connectionHandler, socket) {
  let intervals = [];
  let data = {};
  let tmpData = {};
  const blocks = new api.blocks(app);
  const common = new api.common(app);
  const delegates = new api.delegates(app);
  const connection = new connectionHandler('Header:', socket, this);

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
          // Update and emit delegate proposals every 10 minutes by default
          newInterval(1, config.proposals.updateInterval || 600000, emitDelegateProposals);
        }
      }.bind(this));

    emitDelegateProposals();
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
    logger[level]('Header:', msg);
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
    blocks.getBlockStatus(
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
    common.getPriceTicker(
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

  const getDelegateProposals = function (cb) {
    if (running.getDelegateProposals) {
      return cb('getDelegateProposals (already running)');
    }
    running.getDelegateProposals = true;
    return delegates.getDelegateProposals(
      (res) => {
        running.getDelegateProposals = false;
        cb('DelegateProposals');
      },
      (res) => {
        running.getDelegateProposals = false;
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

  const emitDelegateProposals = function () {
    if (!config.proposals.enabled) {
      return false;
    }

    async.parallel([
        getDelegateProposals,
      ],
      (err, res) => {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          tmpData.proposals = res[0];
        }

        log('info', 'Emitting updated delegate proposals');
        socket.emit('delegateProposals', tmpData.proposals);
      });
  };
};
