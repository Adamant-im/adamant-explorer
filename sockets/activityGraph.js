const statisticsHandler = require('../api/lib/adamant/handlers/statistics');
const transactionsHandler = require('../api/lib/adamant/handlers/transactions');

module.exports = function (app, connectionHandler, socket) {
  let interval = null;
  let data = {};
  const connection = new connectionHandler('Activity Graph: ', socket, this);
  const running = { getlastBlock: false };

  this.onInit = function () {
    emitLastBlock();

    if (interval == null) {
      interval = setInterval(emitLastBlock, 10000);
    }
  };

  this.onConnect = function () {
    log('Emitting existing data');
    socket.emit('data', data);
  };

  this.onDisconnect = function () {
    clearInterval(interval);
    interval = null;
    data = {};
  };

  // Private

  const log = function (level, msg) {
    // logger[level]('Activity Graph: ', msg);
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
    return res.success && (data.block == null) || (res.block.height > data.block.height);
  };

  const emitLastBlock = function () {
    getLastBlock((err, res) => {
      if (err) {
        log('error', 'Error retrieving: ' + err);
      } else if (newLastBlock(res)) {
        data = res;
      }
      log('info', 'Emitting new data');
      socket.emit('data', data);
    });
  };
};
