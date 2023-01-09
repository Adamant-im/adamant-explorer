'use strict';

const api = require('./api');

/**
 * Get account by address
 * @param {String} address
 * @returns {Promise<Object>}
 */
function getAccountByAddress(address) {
  return new Promise((resolve, reject) => {
    api.get('accounts', {address})
      .then((response) => {
        if (!response.success) {
          reject(response.errorMessage);
        }

        const account = response.data.account;

        resolve(account);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get account by public key
 * @param {String} publicKey
 * @returns {Promise<Object>}
 */
function getAccountByPublicKey(publicKey) {
  return new Promise((resolve, reject) => {
    api.get('accounts', {publicKey})
      .then((response) => {
        if (!response.success) {
          reject(response.errorMessage);
        }

        const account = response.data.account;

        resolve(account);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get top accounts
 * @param {Object} query
 * @returns {Promise<Object>}
 */
function getTopAccounts(query) {
  return new Promise((resolve, reject) => {
    api.get('accounts/top', {offset: query.offset, limit: query.limit})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        resolve(response.data.accounts);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get incoming transactions count by address
 * @param {String} address
 * @returns {Promise<Number>} incoming_cnt or 0
 */
function getIncomingTxsCnt(address) {
  return new Promise((resolve, reject) => {
    if (!address) {
      resolve(undefined);
    }

    api.get('api/transactions', {recipientId: address, limit: 1})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        const incoming_cnt = response.data.success ? response.data.count : 0;

        resolve(incoming_cnt);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get outgoing transactions count by address
 * @param {String} address
 * @returns {Promise<Number>} outgoing_cnt or 0
 */
function getOutgoingTxsCnt(address) {
  return new Promise((resolve, reject) => {
    if (!address) {
      resolve(undefined);
    }

    api.get('api/transactions', {senderId: address, limit: 1})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        const outgoing_cnt = response.data.success ? response.data.count : 0;

        resolve(outgoing_cnt);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  getAccountByAddress,
  getAccountByPublicKey,
  getTopAccounts,
  getIncomingTxsCnt,
  getOutgoingTxsCnt,
};
