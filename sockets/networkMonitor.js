const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const { BLOCK_INTERVAL_MILLISECONDS } = require('../api/lib/adamant/constants.mjs');
const logger = require('../utils/log');
const { getRetryDelay } = require('./retrySchedule');
const { scheduleTimerSlot } = require('./timerSchedule');

module.exports = function (app, connectionHandler, socket) {
  let data = {};
  let timers = [];
  let monitoring = false;
  let generation = 0;
  let unsubscribeFromBlocks = null;
  let unsubscribeFromPeers = null;
  const refreshAttempts = [];
  const sourceRevisions = {
    blocks: 0,
    lastBlock: 0,
    peers: 0,
  };
  new connectionHandler('Network Monitor:', socket, this);

  const running = {
    getLastBlock: false,
    getBlocks: false,
    getPeers: false,
  };

  this.onInit = function () {
    monitoring = true;
    generation++;
    refreshAttempts.fill(0);
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
    initializeSource(
      0,
      'lastBlock',
      getLastBlock,
      BLOCK_INTERVAL_MILLISECONDS,
      'data1',
      generation,
    );
    initializeSource(1, 'blocks', getBlocks, 300000, 'data2', generation);
    initializeSource(2, 'peers', getPeers, undefined, undefined, generation);
  };

  this.onConnect = function (client = socket) {
    log('debug', `Emitted cached data; sources=${Object.keys(data).join(',') || 'none'}`);
    client.emit('data', data);
  };

  this.onDisconnect = function () {
    monitoring = false;
    generation++;
    refreshAttempts.fill(0);

    for (const timer of timers) {
      clearTimeout(timer);
    }
    timers = [];

    unsubscribeFromBlocks?.();
    unsubscribeFromBlocks = null;
    unsubscribeFromPeers?.();
    unsubscribeFromPeers = null;
  };

  // Private

  const log = function (level, msg) {
    logger[level](`Network Monitor: ${msg}`);
  };

  const isActive = function (expectedGeneration) {
    return monitoring && generation === expectedGeneration;
  };

  /**
   * Load one initial data source, emit it immediately, and start its refresh.
   * Failed sources retry independently without delaying successful cards.
   * @param {number} index Timer slot
   * @param {string} key Data property emitted to clients
   * @param {Function} loader Callback-style source loader
   * @param {number} [delay] Refresh interval in milliseconds
   * @param {string} [event] Periodic Socket.IO event name
   * @param {number} expectedGeneration Active namespace lifecycle generation
   * @param {number} [attempt=0] Consecutive initial failure count
   */
  const initializeSource = function (
    index,
    key,
    loader,
    delay,
    event,
    expectedGeneration,
    attempt = 0,
  ) {
    const revision = sourceRevisions[key];

    invokeLoader(loader, (err, result) => {
      if (!isActive(expectedGeneration)) {
        return;
      }

      if (err) {
        const retryDelay = getRetryDelay(attempt);
        log('warn', `Initial ${key} load failed (${err}); retrying in ${retryDelay}ms`);

        if (timers[index] === undefined) {
          scheduleTimerSlot(
            timers,
            index,
            () => {
              if (isActive(expectedGeneration)) {
                initializeSource(index, key, loader, delay, event, expectedGeneration, attempt + 1);
              }
            },
            retryDelay,
          );
        }

        return;
      }

      refreshAttempts[index] = 0;

      if (sourceRevisions[key] === revision) {
        data[key] = result;
        log('debug', `Emitted initial ${key} snapshot`);
        socket.emit('data', { [key]: result });
      } else {
        log('debug', `Ignored stale initial ${key} snapshot after a shared update`);
      }

      if (delay && event) {
        scheduleSourceRefresh(index, key, loader, delay, event, expectedGeneration, delay);
      }
    });
  };

  /**
   * Contain synchronous loader failures and normalize callback invocation.
   * @param {Function} loader Callback-style data source
   * @param {Function} callback Node-style completion callback
   */
  const invokeLoader = function (loader, callback) {
    let settled = false;
    const done = (error, result) => {
      if (settled) {
        return;
      }

      settled = true;
      callback(error, result);
    };

    try {
      loader(done);
    } catch (error) {
      done(error);
    }
  };

  const scheduleSourceRefresh = function (
    index,
    key,
    loader,
    delay,
    event,
    expectedGeneration,
    nextDelay,
  ) {
    if (!isActive(expectedGeneration) || timers[index] !== undefined) {
      return;
    }

    scheduleTimerSlot(
      timers,
      index,
      () => refreshSource(index, key, loader, delay, event, expectedGeneration),
      nextDelay,
    );
  };

  /**
   * Refresh a source serially so a slow request cannot overlap the next tick.
   * Shared accumulator updates win over older in-flight polling responses.
   */
  const refreshSource = function (index, key, loader, delay, event, expectedGeneration) {
    if (!isActive(expectedGeneration)) {
      return;
    }

    const revision = sourceRevisions[key];

    invokeLoader(loader, (error, result) => {
      if (!isActive(expectedGeneration)) {
        return;
      }

      let nextDelay = delay;

      if (error) {
        nextDelay = Math.max(delay, getRetryDelay(refreshAttempts[index]++));
        log('warn', `${key} refresh failed (${error}); next attempt in ${nextDelay}ms`);
      } else {
        refreshAttempts[index] = 0;

        if (sourceRevisions[key] === revision) {
          data[key] = result;
          socket.emit(event, { [key]: result });
          log('debug', `Emitted ${key} refresh`);
        } else {
          log('debug', `Ignored stale ${key} refresh after a shared update`);
        }
      }

      scheduleSourceRefresh(index, key, loader, delay, event, expectedGeneration, nextDelay);
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

    sourceRevisions.blocks++;
    data.blocks = update.blocks;
    socket.emit('data2', { blocks: update.blocks });
    log(
      'debug',
      `Forwarded block statistics; source=${update.source ?? 'unknown'}; height=${update.lastBlock?.height ?? 'unknown'}`,
    );

    if (update.lastBlock) {
      sourceRevisions.lastBlock++;
      data.lastBlock = { success: true, block: update.lastBlock };
      socket.emit('data1', { lastBlock: data.lastBlock });
    }
  };

  /** Push process-wide peer snapshots without restarting collection per browser. */
  const handlePeerStatisticsUpdate = function (update) {
    if (!monitoring || !update.peers) {
      return;
    }

    sourceRevisions.peers++;
    data.peers = update.peers;
    socket.emit('data3', { peers: update.peers });
    log(
      'debug',
      `Forwarded peer statistics; source=${update.source ?? 'unknown'}; ` +
        `connected=${update.peers.list?.connected?.length ?? 0}; disconnected=${update.peers.list?.disconnected?.length ?? 0}`,
    );
  };
};
