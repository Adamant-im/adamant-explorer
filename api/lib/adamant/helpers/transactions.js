const accounts = require("../requests/accounts");
const delegates = require("../requests/delegates");
const knowledge = require("../../../../utils/knownAddresses");

/**
 * Get knowledge, senderDelegate, recipientPublicKey, recipientDelegate information for transaction
 * @param {Object} transaction
 * @returns {Promise<Object>}
 */
async function processTransaction(transaction) {
  transaction = knowledge.inTx(transaction);

  // Get sender delegate
  transaction.senderDelegate = transaction.senderPublicKey
    ? await delegates.getDelegate(transaction.senderPublicKey)
    : null;

  // Get recipient public key
  transaction.recipientPublicKey = (!transaction.recipientId || transaction.type !== 0)
    ? null
    : await accounts.getPublicKey(transaction.recipientId);

  // // Get recipient delegate
  transaction.recipientDelegate = transaction.recipientPublicKey
    ? await delegates.getDelegate(transaction.recipientPublicKey)
    : null;

  // Get delegates for votes
  if (transaction.votes) {
    transaction.added = await Promise.all(transaction.votes.added.map(async (publicKey) => {
      return await delegates.getDelegate(publicKey);
    }));

    transaction.deleted = await Promise.all(transaction.votes.deleted.map(async (publicKey) => {
      return await delegates.getDelegate(publicKey);
    }));
  }

  return transaction;
}

/**
 * Concatenate 2 arrays with transactions
 * @param {Array} transactions1
 * @param {Array} transactions2
 * @returns {Array}
 */
function concatenateTransactions(transactions1, transactions2) {
  transactions1 = transactions1.concat(transactions2);

  transactions1.sort((a, b) => {
    if (a.timestamp > b.timestamp) {
      return -1;
    } else if (a.timestamp < b.timestamp) {
      return 1;
    } else {
      return 0;
    }
  });

  return transactions1.slice(0, 20);
}

/**
 * Parse transaction request query
 * @param {Object} params
 * @returns {Array}
 */
function normalizeTransactionParams(params) {
  if (!params || (!params.address && !params.senderId && !params.recipientId)) {
    throw 'Missing/Invalid address parameter';
  }

  let directionQueries = [];
  const baseQuery = {
    orderBy: 'timestamp:desc',
    offset: param(params.offset, 0),
    limit: param(params.limit, 100),
  };

  if (params.direction === 'sent') {
    directionQueries.push({
      ...baseQuery,
      'and:senderId': params.address,
      'and:minAmount': 1,
    });
  } else if (params.direction === 'received') {
    directionQueries.push({
      ...baseQuery,
      'and:recipientId': params.address,
      'and:minAmount': 1,
    });
  } else if (params.direction === 'others') {
    for (let i = 1; i < 8; ++i) {
      directionQueries.push({
        ...baseQuery,
        'and:senderId': params.address,
        'and:type': i,
      });
    }
  } else if (params.address) {
    directionQueries.push({
      ...baseQuery,
      'and:recipientId': params.address,
      'or:senderId': params.address,
    });
  } else {
    let advanced = {};
    Object.keys(params).forEach((key) => {
      if (!(/key|url|parent|orderBy|offset|limit|type|recipientId|query/.test(key))) {
        advanced[`and:${key}`] = params[key];
      }
    });

    if (params.type) {
      params.type.split(',').forEach((type) => {
        if (type) {
          directionQueries.push({
            ...baseQuery,
            ...advanced,
            'and:type': type,
          });
        }
      });
    } else {
      directionQueries.push({
        ...baseQuery,
        ...advanced,
      });
    }

    if (params.recipientId === params.senderId) {
      directionQueries = directionQueries.map((query) => {
        if (query['and:senderId']) {
          query['and:senderId'] = query['recipientId'];
          query['and:senderId'] = undefined;

          return query;
        }
      });
    } else if (params.recipientId && !params.senderId) {
      directionQueries = directionQueries.map((query) => {
        return {
          ...query,
          'and:recipientId': params.recipientId,
        };
      });
    }
  }

  return directionQueries;
}

/**
 * Get index by id
 * @param {Array} list
 * @param {Object} item
 * @returns {Number}
 */
function indexOfById(list, item) {
  let index = -1;
  list.forEach((mem, i) => {
    if (mem.id === item.id) {
      index = i;
    }
  });

  return index;
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
  normalizeTransactionParams,
  indexOfById,
  param,
};
