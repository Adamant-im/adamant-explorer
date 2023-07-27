const api = require('./api');

/**
 * Get confirmed transaction by id
 * @param {String} id
 * @returns {Promise<Object>}
 */
function getConfirmedTransaction(id) {
  return new Promise((resolve, reject) => {
    api.get('transactions/get', {id})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transaction)
          : reject(response.errorMessage);
      });
  });
}

/**
 * Get unconfirmed transaction by id
 * @param {String} id
 * @returns {Promise<Object>}
 */
function getUnconfirmedTransaction(id) {
  return new Promise((resolve, reject) => {
    api.get('transactions/unconfirmed/get', {id})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transaction)
          : reject(response.errorMessage);
      });
  });
}

/**
 * Get unconfirmed transactions
 * @returns {Promise<Array>}
 */
function getUnconfirmedTransactions() {
  return new Promise((resolve, reject) => {
    api.get('transactions/unconfirmed')
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      });
  });
}

/**
 * Get latest 20 transactions
 * @returns {Promise<Array>}
 */
function getLastTransactions() {
  return new Promise((resolve, reject) => {
    api.get('transactions', {orderBy: 'timestamp:desc', limit: 20})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get latest 20 transactions without clutter
 * @returns {Promise<Array>}
 */
function getLastTransfers() {
  return new Promise((resolve, reject) => {
    api.get('transactions', {orderBy: 'timestamp:desc', limit: 20, noClutter: 1})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get transactions with given params
 * @param {Object} params
 * @returns {Promise<Array>}
 */
function getTransactions(params) {
  return new Promise((resolve, reject) => {
    api.get('transactions', params)
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get transactions without clutter with given params
 * @param {Object} params
 * @returns {Promise<Array>}
 */
function getTransfers(params) {
  return new Promise((resolve, reject) => {
    api.get('transactions', {noClutter: 1, ...params})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get transactions by block id
 * @param {Object} query
 * @returns {Promise<Array>}
 */
function getTransactionsByBlock(query) {
  return new Promise((resolve, reject) => {
    api.get('transactions', {blockId: query.blockId, orderBy: 'timestamp:desc', offset: query.offset, limit: query.limit})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get latest 5 transactions made for delegate registration
 * @returns {Promise<Array>}
 */
function getRegistrationTransactions() {
  return new Promise((resolve, reject) => {
    api.get('transactions', {orderBy: 'timestamp:desc', limit: 5, type: 2})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get latest 5 transactions made for voting
 * @returns {Promise<Array>}
 */
function getVoteTransactions() {
  return new Promise((resolve, reject) => {
    api.get('transactions', {orderBy: 'timestamp:desc', limit: 5, type: 3})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.transactions)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
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
