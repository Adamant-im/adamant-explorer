const blocksHandler = require('../api/lib/adamant/handlers/blocks');
const commonHandler = require('../api/lib/adamant/handlers/common');
const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
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
  let unsubscribeFromBlocks = null;

  new connectionHandler('Header:', socket, this);

  const running = {
    getBlockStatus: false,
    getPriceTicker: false,
  };

  this.onInit = function () {
    if (!unsubscribeFromBlocks) {
      unsubscribeFromBlocks = statisticsHandler.subscribeBlockStatistics(handleBlockUpdate);
    }

    this.onConnect(); // Prevents data wipe

    async.parallel(
      [getBlockStatus, getPriceTicker],
      function (err, res) {
        if (err) {
          // A failed request must not leave the header empty forever:
          // retry until the initial data set is collected
          log('warn', `Initial data load failed (${err}); retrying in 10000ms`);
          setTimeout(() => this.onInit(), 10000);
        } else {
          data.status = res[0];
          data.ticker = res[1];

          log(
            'info',
            `Initialized; height=${data.status?.height ?? 'unknown'}; tickerCurrencies=${Object.keys(data.ticker?.tickers ?? {}).length}`,
          );
          log('debug', 'Emitted initial data snapshot');
          socket.emit('data', data);

          newInterval(0, 10000, emitData);
        }
      }.bind(this),
    );
  };

  this.onConnect = function () {
    log('debug', `Emitted cached data; height=${data.status?.height ?? 'unknown'}`);
    socket.emit('data', data);
  };

  this.onDisconnect = function () {
    for (let i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }
    intervals = [];

    unsubscribeFromBlocks?.();
    unsubscribeFromBlocks = null;
  };

  // Private

  const log = function (level, msg) {
    logger[level]('Header: ' + msg);
  };

  /**
   * Forward the shared block accumulator event to every browser. The compact
   * payload lets pages refresh on the block that invalidates their data while
   * the regular status poll remains a fallback for Node WebSocket outages.
   * @param {{lastBlock?: Object}} update Shared block-statistics update
   */
  const handleBlockUpdate = function (update) {
    const block = update.lastBlock;
    const height = Number(block?.height);

    if (!Number.isSafeInteger(height) || height < 1) {
      return;
    }

    if (data.status?.success) {
      data.status = { ...data.status, height };
    }

    socket.emit('block', {
      id: block.id,
      height,
      timestamp: block.timestamp,
    });
    log('debug', `Forwarded block event; height=${height}; source=${update.source ?? 'unknown'}`);
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
          log('warn', `Periodic data refresh failed (${err}); next attempt in 10000ms`);
        } else {
          thisData.status = res[0];
          thisData.ticker = res[1];

          data = thisData;
          log('debug', `Emitted refreshed data; height=${thisData.status?.height ?? 'unknown'}`);
          socket.emit('data', thisData);
        }
      }.bind(this),
    );
  };
};
