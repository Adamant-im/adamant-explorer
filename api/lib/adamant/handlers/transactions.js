'use strict';

const transactions = require('../requests/transactions');
const helpers = require('../helpers/transactions');
const knowledge = require('../../../../utils/knownAddresses');
const logger = require('../../../../utils/log');

/**
 * Get transaction by id
 * @param {String} transactionId
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getTransaction(transactionId, error, success) {
  try {
    if (!transactionId) {
      return error({
        success: false,
        error: 'Missing/Invalid transactionId parameter',
      });
    }

    const result = {};

    result.transaction = await transactions.getConfirmedTransaction(transactionId)
      .catch(() => {
        return transactions.getUnconfirmedTransaction(transactionId);
      });

    result.transaction = await helpers.processTransaction(result.transaction);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get unconfirmed transactions
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getUnconfirmedTransactions(error, success) {
  try {
    const result = {};

    result.transactions = await transactions.getUnconfirmedTransactions();

    console.log(result.transactions);

    result.transactions = await Promise.all(result.transactions.map(async (transaction) => {
      return await helpers.processTransaction(transaction);
    }));

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get latest 20 transactions and unconfirmed transactions
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastTransactions(error, success) {
  try {
    const result = {};

    result.transactions = await transactions.getLastTransactions();

    result.transactions = result.transactions.map((transaction) => {
      return knowledge.inTx(transaction);
    });

    const unconfirmedTransactions = await transactions.getUnconfirmedTransactions();

    result.transactions = helpers.concatenateTransactions(result.transactions, unconfirmedTransactions);

    result.transactions = await Promise.all(result.transactions.map(async (transaction) => {
      return await helpers.processTransaction(transaction);
    }));

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get latest 20 transactions without clutter and unconfirmed transactions
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastTransfers(error, success) {
  try {
    const result = {};

    result.transactions = await transactions.getLastTransfers();


    result.transactions = result.transactions.map((transaction) => {
      return knowledge.inTx(transaction);
    });

    const unconfirmedTransactions = await transactions.getUnconfirmedTransactions();

    result.transactions = helpers.concatenateTransactions(result.transactions, unconfirmedTransactions);


    result.transactions = await Promise.all(result.transactions.map(async (transaction) => {
      return await helpers.processTransaction(transaction);
    }));


    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get transactions with given params
 * @param {Object} query
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getTransactionsByAddress(query, error, success) {
  try {
    const result = {};
    result.transactions = [];

    const data = helpers.normalizeTransactionParams(query);

    await Promise.all(data.map((async (query, i) => {
      let errorMessage;
      let txs;

      try {
        txs = await transactions.getTransactions(query);
      } catch (err) {
        errorMessage = err;
      }

      txs.forEach((transaction) => {
        if (helpers.indexOfById(result.transactions, transaction) < 0) {
          result.transactions.push(transaction);
        }
      });

      if (i === data.length - 1) {
        if (!(result.transactions > 0 || !errorMessage)) {
          return error({
            success: false,
            error: 'Response was unsuccessful',
          });
        }
      }
    })));

    result.transactions = await Promise.all(result.transactions.map(async (transaction) => {
      return await helpers.processTransaction(transaction);
    }));

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get transactions without clutter with given params
 * @param {Object} query
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getTransfersByAddress(query, error, success) {
  try {
    const result = {};
    result.transactions = [];

    const data = helpers.normalizeTransactionParams(query);

    await Promise.all(data.map((async (query, i) => {
      if (query.senderId && query.recipientId) {
        query['and:recipientId'] = undefined;
        query['and:inId'] = query['and:senderId'];
      }

      let errorMessage;
      let txs;

      try {
        txs = await transactions.getTransactions(query);
      } catch (err) {
        errorMessage = err;
      }

      txs.forEach((transaction) => {
        if (helpers.indexOfById(result.transactions, transaction) < 0) {
          result.transactions.push(transaction);
        }
      });

      if (i === data.length - 1) {
        if (!(result.transactions > 0 || !errorMessage)) {
          return error({
            success: false,
            error: 'Response was unsuccessful',
          });
        }
      }
    })));

    result.transactions = await Promise.all(result.transactions.map(async (transaction) => {
      return await helpers.processTransaction(transaction);
    }));

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * @param {Object} query
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getTransactionsByBlock(query, error, success) {
  try {
    if (!query.blockId) {
      return error({
        success: false,
        error: 'Missing/Invalid blockId parameter',
      });
    }

    query.offset = helpers.param(query.offset, 0);
    query.limit = helpers.param(query.limit, 100);

    const result = {};

    result.transactions = await transactions.getTransactionsByBlock(query);


    result.transactions = await Promise.all(result.transactions.map(async (transaction) => {
      return await helpers.processTransaction(transaction);
    }));

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

module.exports = {
  getTransaction,
  getUnconfirmedTransactions,
  getLastTransactions,
  getLastTransfers,
  getTransactionsByAddress,
  getTransfersByAddress,
  getTransactionsByBlock,
};
