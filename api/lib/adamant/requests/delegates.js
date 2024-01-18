const api = require('./api');

/**
 * Get delegate info by public key
 * @param {String} publicKey
 * @param {Boolean?} rejectUnsuccessful
 * @returns {Promise<Object|null>}
 */
function getDelegate(publicKey, rejectUnsuccessful) {
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

        if (rejectUnsuccessful && delegate === null) {
          reject(response.errorMessage);
        }

        resolve(delegate);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get votes info by address
 * @param {String} address
 * @returns {Promise<Array|null>}
 */
function getVotes(address) {
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
}

/**
 * Get voters info by public key
 * @param {String} publicKey
 * @returns {Promise<Array|null>}
 */
function getVoters(publicKey) {
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
}

/**
 * Get forging activity of delegate by public key
 * @param {String} publicKey
 * @returns {Promise<Number>} forged or 0
 */
function getForged(publicKey) {
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
}

/**
 * Get active delegates
 * @returns {Promise<Object>}
 */
function getActive() {
  return new Promise((resolve, reject) => {
    api.get('delegates', {orderBy: 'rate:asc', limit: 101})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get 20 standby delegates with given offset
 * @param {Number} offset
 * @param {Number} limit
 * @returns {Promise<Array>}
 */
function getStandby(offset, limit) {
  return new Promise((resolve, reject) => {
    api.get('delegates', {orderBy: 'rate:asc', limit, offset})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get delegate address by username
 * @param {String} params e.g. 'adm_official_pool'
 * @returns {Promise<String>}
 */
function getSearch(params) {
  return new Promise((resolve, reject) => {
    api.get('delegates/search', {q: params, limit: 1})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        !response.data.delegates || !response.data.delegates[0]
          ? reject('Delegate not found')
          : resolve(response.data.delegates[0].address);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get next forgers
 * @returns {Promise<Array>}
 */
function getNextForgers() {
  return new Promise((resolve, reject) => {
    api.get('delegates/getNextForgers', {limit: 101})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve(response.data.delegates)
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = {
  getDelegate,
  getVotes,
  getVoters,
  getForged,
  getActive,
  getStandby,
  getSearch,
  getNextForgers,
};
