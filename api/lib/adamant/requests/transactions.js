const { TransactionType } = require('adamant-api');
const api = require('./api');

/**
 * Transaction types shown in transfer views: token transfers and
 * chat messages that carry ADM. Combined with `minAmount`, this hides
 * messaging and service transactions, matching the UI note on the
 * home page. Service transactions remain visible in the full
 * transaction views.
 *
 * Moving this list to the explorer config is planned as a follow-up
 * of https://github.com/Adamant-im/adamant-explorer/issues/11.
 */
const TRANSFER_TYPES = [TransactionType.SEND, TransactionType.CHAT_MESSAGE];

/**
 * Extract the transaction list from a node response or throw its error.
 * @param {Object} response Normalized SDK response
 * @returns {Array} List of transactions
 * @throws {string} Node error message when the request fails
 */
function unwrapTransactions(response) {
  if (!response.success) {
    throw response.errorMessage;
  }

  return response.transactions;
}

/**
 * Get a confirmed transaction by its id.
 * @param {string} id Transaction id
 * @returns {Promise<Object>} Transaction body
 * @throws {string} Node error message when the request fails or the transaction is not found
 */
async function getConfirmedTransaction(id) {
  const response = await api.getTransaction(id);

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.transaction;
}

/**
 * Get an unconfirmed transaction by its id.
 * @param {string} id Transaction id
 * @returns {Promise<Object>} Transaction body
 * @throws {string} Node error message when the request fails or the transaction is not found
 */
async function getUnconfirmedTransaction(id) {
  const response = await api.getUnconfirmedTransaction(id);

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.transaction;
}

/**
 * Get all unconfirmed transactions.
 * @returns {Promise<Array>} List of transactions
 * @throws {string} Node error message when the request fails
 */
async function getUnconfirmedTransactions() {
  return unwrapTransactions(await api.getUnconfirmedTransactions());
}

/**
 * Get the latest 20 transactions of any type.
 * @returns {Promise<Array>} List of transactions
 * @throws {string} Node error message when the request fails
 */
async function getLastTransactions() {
  return unwrapTransactions(await api.getTransactions({ orderBy: 'timestamp:desc', limit: 20 }));
}

/**
 * Get the latest 20 transfer transactions, including in-chat transfers.
 * @returns {Promise<Array>} List of transactions, newest first
 * @throws {string} Node error message when the request fails
 */
async function getLastTransfers() {
  return getTransfers({ orderBy: 'timestamp:desc', limit: 20 });
}

/**
 * Get transactions matching an SDK-form query.
 * @param {Object} query Query with filters grouped under `and`/`or`,
 *   see `normalizeTransactionParams`
 * @returns {Promise<Array>} List of transactions
 * @throws {string} Node error message when the request fails
 */
async function getTransactions(query) {
  return unwrapTransactions(await api.getTransactions(query));
}

/**
 * Get transfer transactions matching an SDK-form query: token transfers
 * and chat messages that carry ADM.
 * @param {Object} query Query with filters grouped under `and`/`or`,
 *   see `normalizeTransactionParams`
 * @returns {Promise<Array>} List of transactions
 * @throws {string} Node error message when the request fails
 */
async function getTransfers(query) {
  return unwrapTransactions(
    await api.getTransactions({
      ...query,
      and: { ...query.and, types: TRANSFER_TYPES, minAmount: 1 },
    }),
  );
}

/**
 * Get transactions included in a block.
 * @param {{blockId: string, offset: number, limit: number}} query Block id and pagination
 * @returns {Promise<Array>} List of transactions
 * @throws {string} Node error message when the request fails
 */
async function getTransactionsByBlock(query) {
  return unwrapTransactions(
    await api.getTransactions({
      blockId: query.blockId,
      orderBy: 'timestamp:desc',
      offset: query.offset,
      limit: query.limit,
    }),
  );
}

/**
 * Get the latest 5 delegate registration transactions (type 2).
 * @returns {Promise<Array>} List of transactions
 * @throws {string} Node error message when the request fails
 */
async function getRegistrationTransactions() {
  return unwrapTransactions(
    await api.getTransactions({ orderBy: 'timestamp:desc', limit: 5, type: 2 }),
  );
}

/**
 * Get the latest 5 voting transactions (type 3).
 * @returns {Promise<Array>} List of transactions
 * @throws {string} Node error message when the request fails
 */
async function getVoteTransactions() {
  return unwrapTransactions(
    await api.getTransactions({ orderBy: 'timestamp:desc', limit: 5, type: 3 }),
  );
}

module.exports = {
  getConfirmedTransaction,
  getUnconfirmedTransaction,
  getUnconfirmedTransactions,
  getLastTransactions,
  getLastTransfers,
  getTransactions,
  getTransfers,
  getTransactionsByBlock,
  getRegistrationTransactions,
  getVoteTransactions,
};
