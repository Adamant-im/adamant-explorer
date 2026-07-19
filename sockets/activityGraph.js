const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const transactionsHandler = require('../api/lib/adamant/handlers/transactions');
const { BLOCK_INTERVAL_MILLISECONDS } = require('../api/lib/adamant/constants.mjs');
const logger = require('../utils/log');
const { getRetryDelay } = require('./retrySchedule');

module.exports = function (app, connectionHandler, socket) {
  let timer = null;
  let data = {};
  let monitoring = false;
  let generation = 0;
  let retryAttempt = 0;
  new connectionHandler('Activity Graph:', socket, this);
  const running = { getLastBlock: false };

  this.onInit = function () {
    monitoring = true;
    generation++;
    retryAttempt = 0;
    emitLastBlock(generation);
  };

  this.onConnect = function (client = socket) {
    log('debug', `Emitted cached data; height=${data.block?.height ?? 'unknown'}`);
    client.emit('data', data);
  };

  this.onDisconnect = function () {
    monitoring = false;
    generation++;
    retryAttempt = 0;
    clearTimeout(timer);
    timer = null;
    data = {};
  };

  // Private

  const log = function (level, msg) {
    logger[level](`Activity Graph: ${msg}`);
  };

  const isActive = function (expectedGeneration) {
    return monitoring && generation === expectedGeneration;
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
        if (res?.success && Number(res.block?.numberOfTransactions) > 0) {
          getBlockTransactions(res, cb);
        } else {
          running.getLastBlock = false;
          cb(null, res);
        }
      },
    );
  };

  const getBlockTransactions = function (resBlock, cb) {
    transactionsHandler.getTransactionsByBlock(
      {
        blockId: resBlock.block.id,
        offset: 0,
        limit: 100,
      },
      (res) => {
        running.getLastBlock = false;
        cb('BlockTransactions');
      },
      (res) => {
        if (res.success) {
          resBlock.block.transactions = res.transactions;
        } else {
          resBlock.block.transactions = [];
        }
        running.getLastBlock = false;
        cb(null, resBlock);
      },
    );
  };

  const newLastBlock = function (res) {
    const height = Number(res?.block?.height);
    const previousHeight = Number(data.block?.height);

    return (
      res?.success === true &&
      Number.isSafeInteger(height) &&
      height > 0 &&
      (data.block == null || !Number.isSafeInteger(previousHeight) || height > previousHeight)
    );
  };

  const scheduleRefresh = function (expectedGeneration, delay) {
    if (!isActive(expectedGeneration) || timer !== null) {
      return;
    }

    timer = setTimeout(() => {
      timer = null;
      emitLastBlock(expectedGeneration);
    }, delay);
  };

  /**
   * Refresh one block at a time and schedule the next request only after the
   * current block and its transactions have settled.
   * @param {number} expectedGeneration Active namespace lifecycle generation
   */
  const emitLastBlock = function (expectedGeneration) {
    if (!isActive(expectedGeneration)) {
      return;
    }

    getLastBlock((err, res) => {
      if (!isActive(expectedGeneration)) {
        return;
      }

      let delay = BLOCK_INTERVAL_MILLISECONDS;

      if (err) {
        delay = getRetryDelay(retryAttempt++);
        log('warn', `Block refresh failed (${err}); next attempt in ${delay}ms`);
      } else if (newLastBlock(res)) {
        retryAttempt = 0;
        data = res;
      } else {
        retryAttempt = 0;
      }

      log(
        'debug',
        `Emitted data; height=${data.block?.height ?? 'unknown'}; transactions=${data.block?.transactions?.length ?? data.block?.numberOfTransactions ?? 0}`,
      );
      socket.emit('data', data);
      scheduleRefresh(expectedGeneration, delay);
    });
  };
};
