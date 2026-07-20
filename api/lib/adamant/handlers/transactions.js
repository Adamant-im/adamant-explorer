const transactions = require('../requests/transactions');
const helpers = require('../helpers/transactions');
const knowledge = require('../../../../utils/knownAddresses');
const logger = require('../../../../utils/log');
const { isPublicOperationType } = require('../transactionTypes');
const { TRANSACTION_PAGE_MAX_LIMIT, TRANSACTION_PAGE_MAX_OFFSET } = require('../constants.mjs');
const {
  ValidationError,
  isUnsignedIdentifier,
  parseIntegerParameter,
} = require('../helpers/validation');

/**
 * Get transaction by id
 * @param {String} transactionId
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getTransaction(transactionId, error, success) {
  if (!isUnsignedIdentifier(transactionId)) {
    return error({
      success: false,
      error: 'Missing/Invalid transactionId parameter',
    });
  }

  try {
    const result = {};

    result.transaction = await transactions.getConfirmedTransaction(transactionId).catch(() => {
      return transactions.getUnconfirmedTransaction(transactionId);
    });

    result.transaction = await helpers.processTransaction(result.transaction);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(`Transactions handler: Failed to load transaction details: ${err}`);
    return error({
      success: false,
      error: 'Request unsuccessful',
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

    result.transactions = await Promise.all(
      result.transactions.map(async (transaction) => {
        return await helpers.processTransaction(transaction);
      }),
    );

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(`Transactions handler: Failed to load unconfirmed transactions: ${err}`);
    return error({
      success: false,
      error: 'Request unsuccessful',
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

    result.transactions = helpers.concatenateTransactions(
      result.transactions,
      unconfirmedTransactions,
    );

    result.transactions = await Promise.all(
      result.transactions.map(async (transaction) => {
        return await helpers.processTransaction(transaction);
      }),
    );

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(`Transactions handler: Failed to load recent transactions: ${err}`);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get latest 20 public operations and non-message unconfirmed transactions.
 *
 * The handler name is retained for API compatibility.
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastTransfers(error, success) {
  try {
    const result = {};

    result.transactions = await transactions.getLastTransfers();
    result.transactions = helpers.sortTransactions(result.transactions).slice(0, 20);

    result.transactions = result.transactions.map((transaction) => {
      return knowledge.inTx(transaction);
    });

    const unconfirmedTransactions = (await transactions.getUnconfirmedTransactions()).filter(
      (transaction) => isPublicOperationType(transaction.type),
    );

    result.transactions = helpers.concatenateTransactions(
      result.transactions,
      unconfirmedTransactions,
    );

    result.transactions = await Promise.all(
      result.transactions.map(async (transaction) => {
        return await helpers.processTransaction(transaction);
      }),
    );

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(`Transactions handler: Failed to load recent transfers: ${err}`);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get transactions of an address or an advanced search query.
 * @param {Object} query Explorer request query
 * @param {Function} error Callback for the error response
 * @param {Function} success Callback for the success response
 * @returns {Promise<*>} Result of the invoked callback
 */
async function getTransactionsByAddress(query, error, success) {
  try {
    const result = {};

    result.transactions = await transactions.getTransactions(
      helpers.normalizeTransactionParams(query),
    );

    result.transactions = await Promise.all(
      result.transactions.map(async (transaction) => {
        return await helpers.processTransaction(transaction);
      }),
    );

    result.success = true;

    return success(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return error({ success: false, error: err.message });
    }

    logger.warn(
      `Transactions handler: Failed to load address transactions; query values omitted from logs: ${err}`,
    );
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get transfer transactions of an address, including in-chat transfers.
 * @param {Object} query Explorer request query
 * @param {Function} error Callback for the error response
 * @param {Function} success Callback for the success response
 * @returns {Promise<*>} Result of the invoked callback
 */
async function getTransfersByAddress(query, error, success) {
  try {
    const result = {};

    const normalized = helpers.normalizeTransactionParams(query);

    // The sender-or-recipient pair collapses into the node's `inId`
    // condition, which matches both directions in a single filter
    if (normalized.or?.senderId && normalized.and?.recipientId) {
      normalized.and.inId = normalized.or.senderId;
      delete normalized.and.recipientId;
      delete normalized.or.senderId;
    }

    result.transactions = await transactions.getTransfers(normalized);

    result.transactions = await Promise.all(
      result.transactions.map(async (transaction) => {
        return await helpers.processTransaction(transaction);
      }),
    );

    result.success = true;

    return success(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return error({ success: false, error: err.message });
    }

    logger.warn(
      `Transactions handler: Failed to load address transfers; query values omitted from logs: ${err}`,
    );
    return error({
      success: false,
      error: 'Request unsuccessful',
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
  if (!isUnsignedIdentifier(query?.blockId)) {
    return error({
      success: false,
      error: 'Missing/Invalid blockId parameter',
    });
  }

  let normalizedQuery;

  try {
    normalizedQuery = {
      blockId: query.blockId,
      offset: parseIntegerParameter(query.offset, {
        name: 'offset',
        defaultValue: 0,
        maximum: TRANSACTION_PAGE_MAX_OFFSET,
      }),
      limit: parseIntegerParameter(query.limit, {
        name: 'limit',
        defaultValue: TRANSACTION_PAGE_MAX_LIMIT,
        minimum: 1,
        maximum: TRANSACTION_PAGE_MAX_LIMIT,
      }),
    };
  } catch (err) {
    return error({ success: false, error: err.message });
  }

  try {
    const result = {};

    result.transactions = await transactions.getTransactionsByBlock(normalizedQuery);

    result.transactions = await Promise.all(
      result.transactions.map(async (transaction) => {
        return await helpers.processTransaction(transaction);
      }),
    );

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(
      `Transactions handler: Failed to load block transactions; offset=${normalizedQuery.offset}; limit=${normalizedQuery.limit}: ${err}`,
    );
    return error({
      success: false,
      error: 'Request unsuccessful',
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
