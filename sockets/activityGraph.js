const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const transactionsHandler = require('../api/lib/adamant/handlers/transactions');
const { BLOCK_INTERVAL_MILLISECONDS } = require('../api/lib/adamant/constants.mjs');
const logger = require('../utils/log');

module.exports = function (app, connectionHandler, socket) {
  let interval = null;
  let data = {};
  new connectionHandler('Activity Graph:', socket, this);
  const running = { getLastBlock: false };

  this.onInit = function () {
    emitLastBlock();

    if (interval == null) {
      interval = setInterval(emitLastBlock, BLOCK_INTERVAL_MILLISECONDS);
    }
  };

  this.onConnect = function () {
    log('debug', `Emitted cached data; height=${data.block?.height ?? 'unknown'}`);
    socket.emit('data', data);
  };

  this.onDisconnect = function () {
    clearInterval(interval);
    interval = null;
    data = {};
  };

  // Private

  const log = function (level, msg) {
    logger[level](`Activity Graph: ${msg}`);
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
        if (res.success && res.block.numberOfTransactions > 0) {
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
    return (res.success && data.block == null) || res.block.height > data.block.height;
  };

  const emitLastBlock = function () {
    getLastBlock((err, res) => {
      if (err) {
        log(
          'warn',
          `Block refresh failed (${err}); next attempt in ${BLOCK_INTERVAL_MILLISECONDS}ms`,
        );
      } else if (newLastBlock(res)) {
        data = res;
      }

      log(
        'debug',
        `Emitted data; height=${data.block?.height ?? 'unknown'}; transactions=${data.block?.transactions?.length ?? data.block?.numberOfTransactions ?? 0}`,
      );
      socket.emit('data', data);
    });
  };
};
