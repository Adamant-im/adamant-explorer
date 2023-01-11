'use strict';

const api = require("./api");

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
};

module.exports = {
  getRegistrationTransactions,
  getVoteTransactions,
};
