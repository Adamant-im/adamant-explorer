'use strict';

const api = require('./api');
const logger = require('../../utils/log');
const _ = require('underscore');

module.exports = function (app) {
  function Active() {
    /**
     * Get active delegates
     * @returns {Promise<Object>}
     */
    this.getActive = function () {
      return new Promise((resolve, reject) => {
        api.get('delegates', {orderBy: "rate:asc", limit: 101})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            if (response.data.success) {
              response.data.delegates = parseDelegates(response.data.delegates);
              resolve(response.data);
            } else {
              reject(response.errorMessage);
            }
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * Get forging activity of delegate
     * @param delegate
     * @returns {Promise<unknown>}
     */
    this.getForged = function (delegate) {
      return new Promise((resolve, reject) => {
        api.get('delegates/forging/getForgedByAccount', {generatorPublicKey: delegate.publicKey})
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

  function Standby() {
    const limit = 20;

    this.getStandby = function (offset) {
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
    };

    // Private

    /**
     * Get pagination from total count
     * @param {Number} totalCount
     * @param {Number} offset
     * @returns {Object}
     */
    this.pagination = function (totalCount, offset) {
      const pagination = {};
      pagination.currentPage = +offset / +limit + 1;

      let totalPages = +totalCount / +limit;
      if (totalPages < totalCount / +limit) {
        totalPages++;
      }

      if (pagination.currentPage > 1) {
        pagination.before = true;
        pagination.previousPage = pagination.currentPage - 1;
      }

      if (pagination.currentPage < totalPages) {
        pagination.more = true;
        pagination.nextPage = pagination.currentPage + 1;
      }

      return pagination;
    };
  }

  function Registrations() {
    /**
     * Get transactions made for delegate registration
     * @returns {Promise<Array>}
     */
    this.getTransactions = function () {
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
    };

    /**
     * Get delegate by transaction sender public key
     * @param {Object} tx
     * @returns {Promise<Object>}
     */
    this.getDelegate = function (tx) {
      return new Promise((resolve, reject) => {
        api.get('delegates/get', {publicKey: tx.senderPublicKey})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            response.data.success
              ? resolve(response.data.delegate)
              : reject(response.errorMessage);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };
  }

  function Votes() {
    /**
     * Get transactions made for voting
     * @returns {Promise<Array>}
     */
    this.getVotes = function () {
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

    /**
     * Get delegate by sender public key
     * @param {Object} tx
     * @returns {Promise<Object|null>}
     */
    this.getDelegate = function (tx) {
      return new Promise((resolve, reject) => {
        api.get('delegates/get', {publicKey: tx.senderPublicKey})
          .then((response) => {
            if (response.details.status !== 200) {
              resolve(null);
            }
            console.log(response.data);
            response.data.success
              ? resolve(response.data.delegate)
              : resolve(null);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };
  }

  function LastBlock() {
    /**
     * Get last block
     * @returns {Promise<Object>}
     */
    this.getBlock = function () {
      return new Promise((resolve, reject) => {
        api.get('blocks', {orderBy: 'height:desc'})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            response.data.success
              ? resolve(response.data.blocks[0])
              : reject(response.errorMessage);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * Get delegate by block generator public key
     * @param {Object} block
     * @returns {Promise<Object>}
     */
    this.getDelegate = function (block) {
      return new Promise((resolve, reject) => {
        api.get('delegates/get', {publicKey: block.generatorPublicKey})
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
  }

  function LastBlocks() {
    /**
     * Get last blocks for given generator public key and limit
     * @param {String} publicKey
     * @param {Number} limit
     * @returns {Promise<Array>}
     */
    this.getLastBlocks = function (publicKey) {
      return new Promise((resolve, reject) => {
        api.get('blocks', {orderBy: 'height:desc', generatorPublicKey: publicKey})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            response.data.blocks = _.isArray(response.data.blocks) ? response.data.blocks : [];

            resolve(response.data.blocks);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };
  }

  function Search() {
    /**
     * Get delegate address by username
     * @param {String} params e.g. 'adm_official_pool'
     * @returns {Promise<String>}
     */
    this.getSearch = function (params) {
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
    };
  }

  function NextForgers() {
    /**
     * Get next forgers
     * @returns {Promise<Array>}
     */
    this.getNextForgers = function () {
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
    };
  }

  const active = new Active();
  const standby = new Standby();
  const registrations = new Registrations();
  const votes = new Votes();
  const lastBlock = new LastBlock();
  const lastBlocks = new LastBlocks();
  const search = new Search();
  const nextForgers = new NextForgers();

  /**
   * Get active delegates info
   * @param error
   * @param success
   * @returns {Promise<*>}
   */
  this.getActive = async function (error, success) {
    try {
      const result = await active.getActive();
      result.delegates = await Promise.all(result.delegates.map(async (delegate) => {
        delegate.forged = await active.getForged(delegate);
        return delegate;
      }));

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
   * Get standby delegates with given offset n
   * @param {Number} n
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getStandby = async function (n, error, success) {
    try {
      const offset = parseInt(n);
      const actualOffset = (isNaN(offset)) ? 101 : offset + 101;

      const result = await standby.getStandby(actualOffset);

      result.delegates = parseDelegates(result.delegates);
      result.totalCount = (result.totalCount - 101);
      result.pagination = standby.pagination(result.totalCount, offset);

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
   * Get latest delegate registrations
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getLatestRegistrations = async function (error, success) {
    try {
      const result = {};

      result.transactions = await registrations.getTransactions();

      result.transactions = await Promise.all(result.transactions.map(async (tx) => {
        tx.delegate = await registrations.getDelegate(tx);
        return tx;
      }));

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
   * Get latest votes
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getLatestVotes = async function (error, success) {
    try {
      const result = {};

      result.transactions = await votes.getVotes();

      result.transactions = await Promise.all(result.transactions.map(async (tx) => {
        tx.delegate = await votes.getDelegate(tx);
        console.log(await votes.getDelegate(tx));
        return tx;
      }));

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
   * Get last block info
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getLastBlock = async function (error, success) {
    try {
      const result = {};
      result.block = await lastBlock.getBlock();

      result.block.delegate = await lastBlock.getDelegate(result.block);

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
   * Get last blocks info for given public key and limit (optional)
   * @param params e.g. {publicKey: "abc123...", limit: 5}
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getLastBlocks = async function (params, error, success) {
    try {
      if (!params.publicKey) {
        return error({
          success: false,
          error: 'Missing/Invalid publicKey parameter',
        });
      }

      if (isNaN(+params.limit) || params.limit > 20) {
        params.limit = 20;
      }

      const result = {};
      result.blocks = await lastBlocks.getLastBlocks(params.publicKey);
      result.blocks.slice(params.limit - 1);

      result.success = true;

      console.log(result);

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
   * Get delegate address by username
   * @param {String} params e.g. 'adm_official_pool'
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getSearch = async function (params, error, success) {
    try {
      if (!params || !params.match(/^(?![0-9]{1,21}[L]$)[0-9a-z.]+/i)) {
        return error({
          success: false,
          error: 'Missing/Invalid username parameter',
        });
      }

      const result = {};

      result.address = await search.getSearch(params);

      result.success = true;

      return success(result);
    } catch (err) {
      logger.log(err);
      return error({
        success: false,
        error: err,
      });
    }
  };

  /**
   * Get next forgers info
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getNextForgers = async function (error, success) {
    try {
      const result = {};

      result.delegates = await nextForgers.getNextForgers();

      result.success = true;

      return success(result);
    } catch (err) {
      logger.error(err);
      return err({
        success: false,
        error: err,
      });
    }
  };

  /**
   * Formats delegate's productivity
   * @param {Array} delegates
   * @returns {Array}
   */
  const parseDelegates = function (delegates) {
    _.each(delegates, (d) => {
      d.productivity = Math.abs(parseFloat(d.productivity)) || 0.0;
    });

    return delegates;
  };
};
