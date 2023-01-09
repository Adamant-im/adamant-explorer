'use strict';

const api = require('./requests/api');
const logger = require("../../../utils/log");
const _ = require('underscore');

module.exports = function (app) {
  function Account() {
    /**
     * Validate account address
     * @param {String} address
     * @returns {Boolean}
     */
    this.validateAddress = function (address) {
      return (
        typeof address === 'string' && address.match(/^[U|u][0-9]{1,21}$/g)
      );
    };

    /**
     * Validate account public key
     * @param {String} publicKey
     * @returns {Boolean}
     */
    this.validatePublicKey = function (publicKey) {
      return (
        typeof publicKey === 'string' &&
        publicKey.match(/^([A-Fa-f0-9]{2}){32}$/g)
      );
    };

    /**
     * Get account by address
     * @param {String} address
     * @returns {Promise<Object>}
     */
    this.getAccountByAddress = function (address) {
      return new Promise((resolve, reject) => {
        api.get('accounts', {address})
          .then((response) => {
            if (!response.success) {
              reject(response.errorMessage);
            }

            const account = response.data.account;
            account.knowledge = knownAddresses.inAccount(account);

            resolve(account);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * Get account by public key
     * @param {String} publicKey
     * @returns {Promise<Object>}
     */
    this.getAccountByPublicKey = function (publicKey) {
      return new Promise((resolve, reject) => {
        api.get('accounts', {publicKey})
          .then((response) => {
            if (!response.success) {
              reject(response.errorMessage);
            }

            const account = response.data.account;
            account.knowledge = knownAddresses.inAccount(account);

            resolve(account);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * Get delegate info by public key
     * @param {Object} account
     * @returns {Promise<Object>} delegate or null
     */
    this.getDelegate = function (account) {
      return new Promise((resolve, reject) => {
        if (!account.publicKey) {
          resolve(undefined);
        }

        api.get('delegates/get', {publicKey: account.publicKey})
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
     * @param {Object} account
     * @returns {Promise<Array>} votes or null
     */
    this.getVotes = function (account) {
      return new Promise((resolve, reject) => {
        if (!account.address) {
          resolve(undefined);
        }

        api.get('accounts/delegates', {address: account.address})
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
              _.each(votes, (d) => {
                d.knowledge = knownAddresses.inAccount(d);
              });
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
     * @param {Object} account
     * @returns {Promise<Array|null>}
     */
    this.getVoters = function (account) {
      return new Promise((resolve, reject) => {
        if (!account.publicKey) {
          resolve(undefined);
        }

        api.get('delegates/voters', {publicKey: account.publicKey})
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
              _.each(voters, (d) => {
                d.knowledge = knownAddresses.inAccount(d);
              });
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
     * @param {Object} account
     * @returns {Promise<Number>} forged or 0
     */
    this.getForged = function (account) {
      return new Promise((resolve, reject) => {
        if (!account.delegate) {
          resolve(undefined);
        }

        api.get('delegates/forging/getForgedByAccount', {generatorPublicKey: account.publicKey})
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
  }

  function TopAccount() {
    /**
     * Get top accounts
     * @param {Object} query
     * @returns {Promise<Object>}
     */
    this.getAccounts = function (query) {
      return new Promise((resolve, reject) => {
        api.get('accounts/top', {offset: param(query.offset, 0), limit: param(query.limit, 100)})
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
    };

    /**
     * Get owner username for account
     * @param account
     * @returns {Promise<Object|null>}
     */
    this.getKnowledge = async function (account) {
      const knowledge = knownAddresses.inAccount(account);

      return (!knowledge && account.publicKey)
        ? await getDelegate(account)
        : knowledge;
    };

    // Private

    /**
     * Get owner username by delegate info
     * @param {Object} account
     * @returns {Promise<Object>}
     */
    const getDelegate = function (account) {
      return new Promise((resolve, reject) => {
        api.get('delegates/get', {publicKey: account.publicKey})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            const knowledge = response.data.success ? knownAddresses.inDelegate(response.data.delegate) : null;

            resolve(knowledge);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };
  }

  const account = new Account();
  const topAccount = new TopAccount();

  /**
   * Get account info
   * @param {Object} params contains address or publicKey
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getAccount = async function (params, error, success) {
    try {
      if (params.address && !account.validateAddress(params.address)) {
        return error({
          success: false,
          error: 'Missing/Invalid address parameter',
        });
      }

      if (params.publicKey && !account.validatePublicKey(params.publicKey)) {
        return error({
          success: false,
          error: 'Missing/Invalid publicKey parameter',
        });
      }

      let result;

      if (params.address) {
        result = await account.getAccountByAddress(params.address);
      } else if (params.publicKey) {
        result = await account.getAccountByPublicKey(params.publicKey);
      } else {
        return error({
          success: false,
          error: 'Missing/Invalid address or publicKey parameter',
        });
      }

      result.delegate = await account.getDelegate(result);

      if (result.delegate) {
        result.delegate.forged = await account.getForged(result);
      }

      result.votes = await account.getVotes(result);
      result.voters = await account.getVoters(result);
      result.incoming_cnt = await account.getIncomingTxsCnt(result);
      result.outgoing_cnt = await account.getOutgoingTxsCnt(result);

      result.success = true;

      return success(result);
    } catch (err) {
      logger.error(err);
      return error({
        success: false,
        error: err,
      });
    }
  };

  /**
   * Get top accounts info
   * @param {Object} query e.g. {offset: 0, limit: 100}
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getTopAccounts = async function (query, error, success) {
    try {
      const result = {};

      result.accounts = await topAccount.getAccounts(query);

      result.accounts = await Promise.all(result.accounts.map(async (account) => {
        account.knowledge = await topAccount.getKnowledge(account);
        return account;
      }));

      result.success = true;

      return success(result);
    } catch (err) {
      return error({
        success: false,
        error: err,
      });
    }
  };

  // Private

  const knownAddresses = app.knownAddresses;

  /**
   * Parse integer or return default value
   * @param {*} p parameter
   * @param {Number} d default value
   * @returns {Number}
   */
  const param = function (p, d) {
    p = parseInt(p);

    if (isNaN(p) || p < 0) {
      return d;
    } else {
      return p;
    }
  };
};
