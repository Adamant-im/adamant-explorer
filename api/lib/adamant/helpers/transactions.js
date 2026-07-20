const accounts = require('../requests/accounts');
const delegates = require('../requests/delegates');
const knowledge = require('../../../../utils/knownAddresses');
const { TRANSACTION_PAGE_MAX_LIMIT, TRANSACTION_PAGE_MAX_OFFSET } = require('../constants.mjs');
const { SERVICE_TYPES } = require('../transactionTypes');
const { concatenateTransactions, sortTransactions } = require('./transactionList');
const { normalizeAdamantAddress, parseIntegerParameter } = require('./validation');

const TRANSACTION_DIRECTIONS = new Set(['sent', 'received', 'others']);

/**
 * Enrich a transaction with knowledge, sender and recipient delegate info,
 * the recipient public key, and vote details.
 * @param {Object} transaction Transaction body from the node
 * @returns {Promise<Object>} The same transaction with extra fields
 */
async function processTransaction(transaction) {
  transaction = knowledge.inTx(transaction);

  const senderDelegateRequest = transaction.senderPublicKey
    ? delegates.getDelegate(transaction.senderPublicKey)
    : Promise.resolve(null);

  // Preserve the public enrichment fields for every plain transfer. The
  // request adapters coalesce and cache immutable delegate/public-key results.
  const recipientPublicKeyRequest =
    transaction.recipientId && transaction.type === 0
      ? transaction.recipientId === transaction.senderId
        ? Promise.resolve(transaction.senderPublicKey || null)
        : accounts.getPublicKey(transaction.recipientId)
      : Promise.resolve(null);

  [transaction.senderDelegate, transaction.recipientPublicKey] = await Promise.all([
    senderDelegateRequest,
    recipientPublicKeyRequest,
  ]);

  // Get recipient delegate
  transaction.recipientDelegate = transaction.recipientPublicKey
    ? await delegates.getDelegate(transaction.recipientPublicKey)
    : null;

  // Get delegates for votes
  if (transaction.votes) {
    transaction.votes.added = await Promise.all(
      transaction.votes.added.map(async (publicKey) => {
        const delegate = await delegates.getDelegate(publicKey);
        return {
          delegate,
        };
      }),
    );

    transaction.votes.deleted = await Promise.all(
      transaction.votes.deleted.map(async (publicKey) => {
        const delegate = await delegates.getDelegate(publicKey);
        return {
          delegate,
        };
      }),
    );
  }

  return transaction;
}

/**
 * Build an SDK-form transaction query from the address-history UI query.
 *
 * The query uses the adamant-api shape where filter conditions are
 * grouped under `and`/`or`, e.g. `{and: {senderId}, or: {recipientId}}`.
 * Only the four parameters used by the current Explorer UI are accepted by
 * routes. This helper independently validates their values before forwarding.
 * @param {Object} params Explorer request query
 * @returns {Object} Query for `getTransactions` or `getTransfers`
 * @throws {TypeError} When address, direction, or pagination is invalid
 */
function normalizeTransactionParams(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError('Missing/Invalid address parameter');
  }

  const address = normalizeAdamantAddress(params.address);
  const direction = params.direction || '';

  if (direction && !TRANSACTION_DIRECTIONS.has(direction)) {
    throw new TypeError('Missing/Invalid direction parameter');
  }

  const query = {
    orderBy: 'timestamp:desc',
    offset: parseIntegerParameter(params.offset, {
      name: 'offset',
      defaultValue: 0,
      maximum: TRANSACTION_PAGE_MAX_OFFSET,
    }),
    limit: parseIntegerParameter(params.limit, {
      name: 'limit',
      defaultValue: TRANSACTION_PAGE_MAX_LIMIT,
      minimum: 1,
      maximum: TRANSACTION_PAGE_MAX_LIMIT,
    }),
  };

  if (direction === 'sent') {
    query.and = { senderId: address, minAmount: 1 };
  } else if (direction === 'received') {
    query.and = { recipientId: address, minAmount: 1 };
  } else if (direction === 'others') {
    query.and = { senderId: address, types: SERVICE_TYPES };
  } else {
    query.and = { recipientId: address };
    query.or = { senderId: address };
  }

  return query;
}

/**
 * Parse integer or return default value
 * @param {*} p parameter
 * @param {Number} d default value
 * @returns {Number}
 */
function param(p, d) {
  try {
    return parseIntegerParameter(p, {
      name: 'integer',
      defaultValue: d,
    });
  } catch {
    return d;
  }
}

module.exports = {
  processTransaction,
  concatenateTransactions,
  sortTransactions,
  normalizeTransactionParams,
  param,
};
