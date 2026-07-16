const async = require('async');
const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const { BLOCK_INTERVAL_MILLISECONDS } = require('../api/lib/adamant/constants.mjs');
const logger = require('../utils/log');

module.exports = function (app, connectionHandler, socket) {
  let data = {};
  let intervals = [];
  let monitoring = false;
  let unsubscribeFromBlocks = null;
  let unsubscribeFromPeers = null;
  new connectionHandler('Network Monitor:', socket, this);

  const running = {
    getLastBlock: false,
    getBlocks: false,
    getPeers: false,
  };

  this.onInit = function () {
    monitoring = true;
    this.onConnect();

    if (!unsubscribeFromBlocks) {
      unsubscribeFromBlocks = statisticsHandler.subscribeBlockStatistics(
        handleBlockStatisticsUpdate,
      );
    }

    if (!unsubscribeFromPeers) {
      unsubscribeFromPeers = statisticsHandler.subscribePeerStatistics(handlePeerStatisticsUpdate);
    }

    // Load independent cards separately. Peers normally resolve immediately
    // from the process-wide cache while a background refresh continues.
    initializeSource(0, 'lastBlock', getLastBlock, BLOCK_INTERVAL_MILLISECONDS, emitData1);
    initializeSource(1, 'blocks', getBlocks, 300000, emitData2);
    initializeSource(2, 'peers', getPeers);
  };

  this.onConnect = function () {
    log('debug', `Emitted cached data; sources=${Object.keys(data).join(',') || 'none'}`);
    socket.emit('data', data);
  };

  this.onDisconnect = function () {
    monitoring = false;

    for (let i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }
    intervals = [];

    unsubscribeFromBlocks?.();
    unsubscribeFromBlocks = null;
    unsubscribeFromPeers?.();
    unsubscribeFromPeers = null;
  };

  // Private

  const log = function (level, msg) {
    logger[level](`Network Monitor: ${msg}`);
  };

  const newInterval = function (i, delay, cb) {
    if (intervals[i] !== undefined) {
      return null;
    } else {
      intervals[i] = setInterval(cb, delay);
      return intervals[i];
    }
  };

  /**
   * Load one initial data source, emit it immediately, and start its refresh.
   * Failed sources retry independently without delaying successful cards.
   * @param {number} index Timer slot
   * @param {string} key Data property emitted to clients
   * @param {Function} loader Callback-style source loader
   * @param {number} [delay] Refresh interval in milliseconds
   * @param {Function} [refresh] Periodic refresh callback
   */
  const initializeSource = function (index, key, loader, delay, refresh) {
    loader((err, result) => {
      if (err) {
        log('warn', `Initial ${key} load failed (${err}); retrying in 10000ms`);

        if (monitoring && intervals[index] === undefined) {
          intervals[index] = setTimeout(() => {
            intervals[index] = undefined;

            if (monitoring) {
              initializeSource(index, key, loader, delay, refresh);
            }
          }, 10000);
        }

        return;
      }

      if (!monitoring) {
        return;
      }

      data[key] = result;
      log('debug', `Emitted initial ${key} snapshot`);
      socket.emit('data', { [key]: result });
      if (delay && refresh) {
        newInterval(index, delay, refresh);
      }
    });
  };

  const getLastBlock = function (cb) {
    if (running.getLastBlock) {
      return cb('getLastBlock (already running)');
    }
    running.getLastBlock = true;
    statisticsHandler.getLastBlock(
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
    statisticsHandler.getBlocks(
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
    statisticsHandler.getPeers(
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

  /** Push shared WebSocket/REST accumulator updates without waiting for polling. */
  const handleBlockStatisticsUpdate = function (update) {
    if (!monitoring) {
      return;
    }

    data.blocks = update.blocks;
    socket.emit('data2', { blocks: update.blocks });
    log(
      'debug',
      `Forwarded block statistics; source=${update.source ?? 'unknown'}; height=${update.lastBlock?.height ?? 'unknown'}`,
    );

    if (update.lastBlock) {
      data.lastBlock = { success: true, block: update.lastBlock };
      socket.emit('data1', { lastBlock: data.lastBlock });
    }
  };

  /** Push process-wide peer snapshots without restarting collection per browser. */
  const handlePeerStatisticsUpdate = function (update) {
    if (!monitoring || !update.peers) {
      return;
    }

    data.peers = update.peers;
    socket.emit('data3', { peers: update.peers });
    log(
      'debug',
      `Forwarded peer statistics; source=${update.source ?? 'unknown'}; ` +
        `connected=${update.peers.list?.connected?.length ?? 0}; disconnected=${update.peers.list?.disconnected?.length ?? 0}`,
    );
  };

  const emitData1 = function () {
    const thisData = {};

    async.parallel(
      [getLastBlock],
      function (err, res) {
        if (err) {
          log(
            'warn',
            `Latest-block refresh failed (${err}); next attempt in ${BLOCK_INTERVAL_MILLISECONDS}ms`,
          );
        } else {
          thisData.lastBlock = data.lastBlock = res[0];

          log(
            'debug',
            `Emitted latest-block refresh; height=${thisData.lastBlock?.block?.height ?? 'unknown'}`,
          );
          socket.emit('data1', thisData);
        }
      }.bind(this),
    );
  };

  const emitData2 = function () {
    const thisData = {};

    async.parallel(
      [getBlocks],
      function (err, res) {
        if (err) {
          log('warn', `Block-statistics refresh failed (${err}); next attempt in 300000ms`);
        } else {
          thisData.blocks = data.blocks = res[0];

          log(
            'debug',
            `Emitted block-statistics refresh; blocks=${thisData.blocks?.volume?.blocks ?? 0}`,
          );
          socket.emit('data2', thisData);
        }
      }.bind(this),
    );
  };
};
