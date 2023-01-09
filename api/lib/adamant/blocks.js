'use strict';

const api = require('./requests/api');
const logger = require("../../../utils/log");
const _ = require('underscore');

module.exports = function (app) {
  function Block() {
    /**
     * Get block by block id
     * @param {Number} blockId
     * @param {Number} height
     * @returns {Promise<Object>}
     */
    this.getBlock = function (blockId, height) {
      return new Promise((resolve, reject) => {
        api.get('blocks/get', {id: blockId})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            response.data.success ? resolve(makeBody(response.data, height)) : reject(response.errorMessage);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * Get block by height
     * @param {Number} height
     * @returns {Promise<Object>}
     */
    this.getBlockByHeight = function (height) {
      return new Promise((resolve, reject) => {
        api.get('blocks', {height})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            response.data.success && response.data.count !== 0
              ? resolve({id: response.data.blocks[0].id, height: response.data.blocks[0].height})
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
     * @returns {Promise<Object|null>}
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

    /**
     * Get latest block height
     * @returns {Promise<Number>}
     */
    this.getBlockHeight = function () {
      return new Promise((resolve, reject) => {
        api.get('blocks/getHeight')
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            response.data.success
              ? resolve(response.data.height)
              : reject(response.errorMessage);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * Get blocks status
     * @returns {Promise<Object>}
     */
    this.getBlockStatus = function () {
      return new Promise((resolve, reject) => {
        api.get('blocks/getStatus')
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
     * Format getBlock data
     * @param {Object} block
     * @param {Number} height
     * @returns {Object}
     */
    const makeBody = function (body, height) {
      body.block.confirmations = height - body.block.height + 1;
      body.block.payloadHash = Buffer.from(body.block.payloadHash).toString('hex');

      return body;
    };
  }

  function Blocks() {
    /**
     * Get blocks with given offset
     * @param {Number} offset
     * @returns {Promise<Array>}
     */
    this.getBlocks = function (offset) {
      return new Promise((resolve, reject) => {
        api.get('blocks', {orderBy: "height:desc", limit: 20, offset})
          .then((response) => {
            if (response.details.status !== 200) {
              reject(response.errorMessage);
            }

            response.data.success
              ? resolve(response.data.blocks)
              : reject(response.errorMessage);
          })
          .catch((err) => {
            reject(err);
          });
      });
    };

    /**
     * Parse integer or return 0
     * @param {*} n
     * @returns {Number|0}
     */
    this.offset = function (n) {
      n = parseInt(n);

      if (isNaN(n) || n < 0) {
        return 0;
      } else {
        return n;
      }
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

    /**
     * Format blocks data
     * @param {Array} blocks
     * @returns {Array}
     */
    this.map = function (blocks) {
      return _.map(blocks, (b) => {
        return {
          id: b.id,
          timestamp: b.timestamp,
          generator: b.generatorId,
          totalAmount: b.totalAmount,
          totalFee: b.totalFee,
          reward: b.reward,
          totalForged: b.totalForged,
          transactionsCount: b.numberOfTransactions,
          height: b.height,
          delegate: b.delegate,
        };
      });
    };

    /**
     * Get paginating for given n and height
     * @param {Number} n
     * @param {Number} height
     * @returns {Object}
     */
    this.pagination = function (n, height) {
      const pagination = {};
      pagination.currentPage = parseInt(n / 20) + 1;

      let totalPages = parseInt(height / 20);
      if (totalPages < height / 20) {
        totalPages++;
      }

      if (pagination.currentPage < totalPages) {
        pagination.before = true;
        pagination.previousPage = pagination.currentPage + 1;
      }

      if (pagination.currentPage > 0) {
        pagination.more = true;
        pagination.nextPage = pagination.currentPage - 1;
      }

      return pagination;
    };
  }

  const block = new Block();
  const blocks = new Blocks();

  /**
   * Get last n blocks
   * @param {Number} n
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getLastBlocks = async function (n, error, success) {
    try {
      const result = {};

      const blockHeight = await block.getBlockHeight();
      result.pagination = blocks.pagination(n, blockHeight);

      result.blocks = await blocks.getBlocks(blocks.offset(n));
      result.blocks = await Promise.all(result.blocks.map(async (block) => {
        block.delegate = await blocks.getDelegate(block);
        return block;
      }));
      result.blocks = blocks.map(result.blocks);

      result.success = true;

      return success(result);
    } catch (err) {
      logger.error(err);
      return error({success: false, error: err});
    }
  };

  /**
   * Get block by block id
   * @param {Number} blockId
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getBlock = async function (blockId, error, success) {
    try {
      if (!blockId) {
        return error({
          success: false,
          error: 'Missing/Invalid blockId parameter',
        });
      }

      const latestHeight = await block.getBlockHeight();

      const result = await block.getBlock(blockId, latestHeight);

      result.block.delegate = await block.getDelegate(result.block);

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
   * Get block by height
   * @param {Number} height
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getHeight = async function (height, error, success) {
    try {
      if (!height) {
        return error({
          success: false,
          error: 'Missing/Invalid height parameter',
        });
      }

      const blockByHeight = await block.getBlockByHeight(height);

      const result = await block.getBlock(blockByHeight.id, blockByHeight.height);

      result.block.delegate = await block.getDelegate(result.block);

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
   * Get blocks status
   * @param {Function} error
   * @param {Function} success
   * @returns {Promise<*>}
   */
  this.getBlockStatus = async function (error, success) {
    try {
      const result = await block.getBlockStatus();

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
};
