'use strict';

const transactionsHandler = require('../api/lib/adamant/handlers/transactions');
const logger = require('../utils/log');

module.exports = function () {

  this.getTransaction = (deferred) => {
    transactionsHandler.getTransaction(
      '9372665649431258697',
      (data) => {
        deferred.resolve();
        logger.warn('transactionsHandler.getTransaction ~> ' + ' Error retrieving transaction: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactionsHandler.getTransaction ~> ' + ' transaction retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getUnconfirmedTransactions = (deferred) => {
    transactionsHandler.getUnconfirmedTransactions(
      (data) => {
        deferred.resolve();
        logger.warn('transactionsHandler.getUnconfirmedTransactions ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactionsHandler.getUnconfirmedTransactions ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLastTransactions = (deferred) => {
    transactionsHandler.getLastTransactions(
      (data) => {
        deferred.resolve();
        logger.warn('transactionsHandler.getLastTransactions ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactionsHandler.getLastTransactions ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
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
        logger.warn('transactionsHandler.getTransactionsByAddress ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactionsHandler.getTransactionsByAddress ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
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
        logger.warn('transactionsHandler.getTransactionsByBlock ~> ' + ' Error retrieving transactions: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('transactionsHandler.getTransactionsByBlock ~> ' + data.transactions.length + ' transactions retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
