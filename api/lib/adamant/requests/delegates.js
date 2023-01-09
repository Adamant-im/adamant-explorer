'use strict';

const api = require("./api");

/**
 * Get delegate info by public key
 * @param {String} publicKey
 * @returns {Promise<Object|null>}
 */
const getDelegate = function (publicKey) {
  return new Promise((resolve, reject) => {
    if (!publicKey) {
      resolve(undefined);
    }

    api.get('delegates/get', {publicKey})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        const delegate = response.data.success ? response.data.delegate : null;

        resolve(delegate);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Get votes info by address
 * @param {String} address
 * @returns {Promise<Array|null>}
 */
const getVotes = function (address) {
  return new Promise((resolve, reject) => {
    if (!address) {
      resolve(undefined);
    }
    api.get('accounts/delegates', {address})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        let votes;
        if (response.data.success) {
          votes =
            response.data.delegates !== undefined &&
            response.data.delegates !== null &&
            response.data.delegates.length > 0
              ? response.data.delegates
              : null;
        } else {
          votes = null;
        }

        resolve(votes);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Get voters info by public key
 * @param {String} publicKey
 * @returns {Promise<Array|null>}
 */
const getVoters = function (publicKey) {
  return new Promise((resolve, reject) => {
    api.get('delegates/voters', {publicKey})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        let voters;
        if (response.data.success) {
          voters =
            response.data.accounts !== undefined &&
            response.data.accounts !== null &&
            response.data.accounts.length > 0
              ? response.data.accounts
              : null;
        } else {
          voters = null;
        }

        resolve(voters);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

/**
 * Get forging activity of delegate by public key
 * @param {String} publicKey
 * @returns {Promise<Number>} forged or 0
 */
function getForged (publicKey) {
  return new Promise((resolve, reject) => {
    api.get('delegates/forging/getForgedByAccount', {generatorPublicKey: publicKey})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        const forged = response.data.success ? response.data.forged : 0;

        resolve(forged);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports = {
  getDelegate,
  getVotes,
  getVoters,
  getForged,
};
