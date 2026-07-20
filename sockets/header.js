const blocksHandler = require('../api/lib/adamant/handlers/blocks');
const commonHandler = require('../api/lib/adamant/handlers/common');
const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const blocks = require('../api/lib/adamant/requests/blocks');
const delegates = require('../api/lib/adamant/requests/delegates');
const {
  countActiveForgingDelegates,
  mergeForgingHealthBlocks,
} = require('../api/lib/adamant/helpers/networkHealth');
const async = require('async');
const logger = require('../utils/log');
const { getForgingSchedule, getRoundDelegates } = require('./delegateMonitorSchedule');
const { getRetryDelay } = require('./retrySchedule');
const { scheduleTimerSlot } = require('./timerSchedule');

/**
 * Header socket namespace. Periodically emits the network status
 * and exchange rates shown in the page header.
 * @param {Object} app Express application
 * @param {Function} connectionHandler Shared socket connection life cycle handler
 * @param {Object} socket Socket.IO namespace
 */
module.exports = function (app, connectionHandler, socket) {
  let timers = [];
  let data = {};
  let monitoring = false;
  let generation = 0;
  let retryAttempt = 0;
  let unsubscribeFromBlocks = null;

  new connectionHandler('Header:', socket, this);

  const running = {
    getBlockStatus: false,
    getForgingHealth: false,
    getPriceTicker: false,
  };

  this.onInit = function () {
    monitoring = true;
    generation++;
    retryAttempt = 0;

    if (!unsubscribeFromBlocks) {
      unsubscribeFromBlocks = statisticsHandler.subscribeBlockStatistics(handleBlockUpdate);
    }

    this.onConnect(); // Prevents data wipe
    initialize(generation);
  };

  this.onConnect = function (client = socket) {
    log('debug', `Emitted cached data; height=${data.status?.height ?? 'unknown'}`);
    client.emit('data', data);
  };

  this.onDisconnect = function () {
    monitoring = false;
    generation++;
    retryAttempt = 0;

    for (const timer of timers) {
      clearTimeout(timer);
    }
    timers = [];

    unsubscribeFromBlocks?.();
    unsubscribeFromBlocks = null;
  };

  // Private

  const log = function (level, msg) {
    logger[level]('Header: ' + msg);
  };

  const isActive = function (expectedGeneration) {
    return monitoring && generation === expectedGeneration;
  };

  /**
   * Run all independent header loaders to completion without allowing one
   * early failure to overlap the next polling attempt with a slow loader.
   * @param {Function} callback Node-style completion callback
   */
  const loadData = function (callback) {
    const settle = (loader) => (done) => {
      try {
        loader((error, result) => done(null, { error, result }));
      } catch (error) {
        done(null, { error });
      }
    };

    async.parallel(
      [settle(getBlockStatus), settle(getPriceTicker), settle(getForgingHealth)],
      (unexpectedError, outcomes) => {
        if (unexpectedError) {
          callback(unexpectedError);
          return;
        }

        const failure = outcomes.find(({ error }) => error);
        callback(
          failure?.error ?? null,
          outcomes.map(({ result }) => result),
        );
      },
    );
  };

  /** Load the first complete snapshot and retry with bounded backoff on failure. */
  const initialize = function (expectedGeneration) {
    if (!isActive(expectedGeneration)) {
      return;
    }

    loadData((error, result) => {
      if (!isActive(expectedGeneration)) {
        return;
      }

      if (error) {
        scheduleInitializationRetry(expectedGeneration, error);
        return;
      }

      data.status = {
        ...result[0],
        forgingDelegates: result[2],
      };
      data.ticker = result[1];
      retryAttempt = 0;

      log(
        'info',
        `Initialized; height=${data.status?.height ?? 'unknown'}; tickerCurrencies=${Object.keys(data.ticker?.tickers ?? {}).length}`,
      );
      log('debug', 'Emitted initial data snapshot');
      socket.emit('data', data);
      scheduleRefresh(expectedGeneration, 10000);
    });
  };

  const scheduleInitializationRetry = function (expectedGeneration, error) {
    if (!isActive(expectedGeneration) || timers[1] !== undefined) {
      return;
    }

    const delay = getRetryDelay(retryAttempt++);
    log('warn', `Initial data load failed (${error}); retrying in ${delay}ms`);
    scheduleTimerSlot(timers, 1, () => initialize(expectedGeneration), delay);
  };

  /** Schedule the next refresh only after every current source has settled. */
  const scheduleRefresh = function (expectedGeneration, delay) {
    if (!isActive(expectedGeneration) || timers[0] !== undefined) {
      return;
    }

    scheduleTimerSlot(timers, 0, () => emitData(expectedGeneration), delay);
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
      forgingDelegates: data.status?.forgingDelegates ?? null,
    });
    log('debug', `Forwarded block event; height=${height}; source=${update.source ?? 'unknown'}`);
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

  /**
   * Builds the same coherent forging snapshot used by Delegate Monitor.
   * Failures preserve the last known count without interrupting header data.
   * @param {Function} cb Node-style completion callback
   */
  const getForgingHealth = function (cb) {
    if (running.getForgingHealth) {
      return cb(null, data.status?.forgingDelegates ?? null);
    }

    running.getForgingHealth = true;

    getForgingHealthSnapshot()
      .then(({ state, recentBlocks }) => {
        const currentBlock = Number(state.currentBlock);

        const schedule = getForgingSchedule(state);
        const roundDelegates = getRoundDelegates(schedule, recentBlocks);
        const count = countActiveForgingDelegates(
          schedule.orderedDelegates,
          recentBlocks,
          currentBlock,
          roundDelegates,
        );

        running.getForgingHealth = false;
        cb(null, count);
      })
      .catch((error) => {
        running.getForgingHealth = false;
        log('warn', `Forging health refresh failed; previous status remains active: ${error}`);
        cb(null, data.status?.forgingDelegates ?? null);
      });
  };

  /**
   * Aligns the forging schedule with recent blocks, bridging the normal race
   * between the schedule REST response and the shared WebSocket block cache.
   * @returns {Promise<{state: Object, recentBlocks: Array<Object>}>} Coherent health input
   */
  const getForgingHealthSnapshot = async function () {
    for (let attempt = 0; attempt < 3; attempt++) {
      const state = await delegates.getNextForgersState();
      const currentBlock = Number(state.currentBlock);
      let recentBlocks = mergeForgingHealthBlocks(
        statisticsHandler.getCachedBlocks(),
        [],
        currentBlock,
      );

      if (Number(recentBlocks[0]?.height) !== currentBlock) {
        const latestBlocks = await blocks.getBlocks(0, 2);
        recentBlocks = mergeForgingHealthBlocks(
          statisticsHandler.getCachedBlocks(),
          latestBlocks,
          currentBlock,
        );
      }

      if (Number(recentBlocks[0]?.height) === currentBlock) {
        return { state, recentBlocks };
      }
    }

    throw new Error('Could not align the forging schedule with recent blocks after 3 attempts');
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

  const emitData = function (expectedGeneration) {
    if (!isActive(expectedGeneration)) {
      return;
    }

    const thisData = {};

    loadData((error, result) => {
      if (!isActive(expectedGeneration)) {
        return;
      }

      if (error) {
        const delay = getRetryDelay(retryAttempt++);
        log('warn', `Periodic data refresh failed (${error}); next attempt in ${delay}ms`);
        scheduleRefresh(expectedGeneration, delay);
      } else {
        retryAttempt = 0;
        thisData.status = {
          ...result[0],
          forgingDelegates: result[2],
        };
        thisData.ticker = result[1];

        data = thisData;
        log('debug', `Emitted refreshed data; height=${thisData.status?.height ?? 'unknown'}`);
        socket.emit('data', thisData);
        scheduleRefresh(expectedGeneration, 10000);
      }
    });
  };
};
