'use strict';

const logger = require('../utils/log');

module.exports = function (app, api) {
  const transactions = new api.transactions(app);

  this.getTransaction = (deferred) => {
    transactions.getTransaction(
      '9372665649431258697',
      (data) => {
        deferred.resolve();
        logger.warn('transactions.getTransaction ~> ' + ' Error retrieving transaction: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactions.getTransaction ~> ' + ' transaction retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getUnconfirmedTransactions = (deferred) => {
    transactions.getUnconfirmedTransactions(
      (data) => {
        deferred.resolve();
        logger.warn('transactions.getUnconfirmedTransactions ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactions.getUnconfirmedTransactions ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLastTransactions = (deferred) => {
    transactions.getLastTransactions(
      (data) => {
        deferred.resolve();
        logger.warn('transactions.getLastTransactions ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactions.getLastTransactions ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getTransactionsByAddress = (deferred) => {
    transactions.getTransactionsByAddress(
      {
        address: 'U9466395914658764774',
        offset: 0,
        limit: 100,
      },
      (data) => {
        deferred.resolve();
        logger.warn('transactions.getTransactionsByAddress ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactions.getTransactionsByAddress ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getTransactionsByBlock = (deferred) => {
    transactions.getTransactionsByBlock(
      {
        blockId: '10491613424735062732',
        offset: 0,
        limit: 100,
      },
      (data) => {
        deferred.resolve();
        logger.warn('transactions.getTransactionsByBlock ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactions.getTransactionsByBlock ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
