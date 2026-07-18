const accounts = require('../requests/accounts');
const delegates = require('../requests/delegates');
const knowledge = require('../../../../utils/knownAddresses');
const { concatenateTransactions, sortTransactions } = require('./transactionList');

/**
 * Enrich a transaction with knowledge, sender and recipient delegate info,
 * the recipient public key, and vote details.
 * @param {Object} transaction Transaction body from the node
 * @returns {Promise<Object>} The same transaction with extra fields
 */
async function processTransaction(transaction) {
  transaction = knowledge.inTx(transaction);

  // Get sender delegate
  transaction.senderDelegate = transaction.senderPublicKey
    ? await delegates.getDelegate(transaction.senderPublicKey)
    : null;

  // Get recipient public key. Only token transfers (type 0) have a recipient account
  transaction.recipientPublicKey =
    !transaction.recipientId || transaction.type !== 0
      ? null
      : await accounts.getPublicKey(transaction.recipientId);

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
 * Transaction types shown by the `others` direction of the address page:
 * every service type, that is everything except token transfers (0)
 * and chat messages (8).
 */
const SERVICE_TYPES = [1, 2, 3, 4, 5, 6, 7, 9];

/**
 * Build an SDK-form transaction query from an explorer request query.
 *
 * The query uses the adamant-api shape where filter conditions are
 * grouped under `and`/`or`, e.g. `{and: {senderId}, or: {recipientId}}`.
 * Type sets are expressed with the node's `types` filter, so every
 * request maps to a single node call.
 * @param {Object} params Explorer request query
 * @returns {Object} Query for `getTransactions` or `getTransfers`
 * @throws {string} `'Missing/Invalid address parameter'` when no filter is given
 */
function normalizeTransactionParams(params) {
  if (!params || (!params.address && !params.senderId && !params.recipientId)) {
    throw 'Missing/Invalid address parameter';
  }

  const query = {
    orderBy: 'timestamp:desc',
    offset: param(params.offset, 0),
    limit: param(params.limit, 100),
  };

  if (params.direction === 'sent') {
    query.and = { senderId: params.address, minAmount: 1 };
  } else if (params.direction === 'received') {
    query.and = { recipientId: params.address, minAmount: 1 };
  } else if (params.direction === 'others') {
    query.and = { senderId: params.address, types: SERVICE_TYPES };
  } else if (params.address) {
    query.and = { recipientId: params.address };
    query.or = { senderId: params.address };
  } else {
    // Advanced search: pass through any filter the node supports,
    // except control and specially handled parameters
    const advanced = {};
    Object.keys(params).forEach((key) => {
      if (!/key|url|parent|orderBy|offset|limit|type|recipientId|query/.test(key)) {
        advanced[key] = params[key];
      }
    });

    query.and = advanced;

    const types = params.type ? params.type.split(',').filter(Boolean) : [];
    if (types.length === 1) {
      query.and.type = types[0];
    } else if (types.length > 1) {
      query.and.types = types;
    }

    // When only recipientId is given, senderId is not in the advanced
    // filters, so add the recipient condition.
    // When recipientId equals senderId, the senderId condition already
    // covers the query and the recipientId filter is ignored
    if (params.recipientId && !params.senderId) {
      query.and.recipientId = params.recipientId;
    }
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
  p = parseInt(p);

  if (isNaN(p) || p < 0) {
    return d;
  } else {
    return p;
  }
}

module.exports = {
  processTransaction,
  concatenateTransactions,
  sortTransactions,
  normalizeTransactionParams,
  param,
};
