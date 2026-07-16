const transactionsHandler = require('../../api/lib/adamant/handlers/transactions');
const logger = require('../../utils/log');

module.exports = function () {
  this.getTransaction = (deferred) => {
    transactionsHandler.getTransaction(
      '9372665649431258697',
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark transactions.getTransaction: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark transactions.getTransaction: Completed; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getUnconfirmedTransactions = (deferred) => {
    transactionsHandler.getUnconfirmedTransactions(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark transactions.getUnconfirmedTransactions: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark transactions.getUnconfirmedTransactions: Completed; transactions=${data.transactions.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getLastTransactions = (deferred) => {
    transactionsHandler.getLastTransactions(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark transactions.getLastTransactions: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark transactions.getLastTransactions: Completed; transactions=${data.transactions.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getTransactionsByAddress = (deferred) => {
    transactionsHandler.getTransactionsByAddress(
      {
        address: 'U9466395914658764774',
        offset: 0,
        limit: 100,
      },
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark transactions.getTransactionsByAddress: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark transactions.getTransactionsByAddress: Completed; transactions=${data.transactions.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getTransactionsByBlock = (deferred) => {
    transactionsHandler.getTransactionsByBlock(
      {
        blockId: '10491613424735062732',
        offset: 0,
        limit: 100,
      },
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark transactions.getTransactionsByBlock: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark transactions.getTransactionsByBlock: Completed; transactions=${data.transactions.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };
};
