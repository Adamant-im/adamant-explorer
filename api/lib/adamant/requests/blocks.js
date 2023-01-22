'use strict';

const api = require("./api");
const _ = require("underscore");

/**
 * Get the latest block height
 * @returns {Promise<Number>}
 */
function getBlockHeight() {
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
}

/**
 * Get block by block id
 * @param {Number} blockId
 * @returns {Promise<Object>} block and nodeTimestamp
 */
function getBlockById(blockId) {
  return new Promise((resolve, reject) => {
    api.get('blocks/get', {id: blockId})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success
          ? resolve({block: response.data.block, nodeTimestamp: response.data.nodeTimestamp})
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get block by height
 * @param {Number} height
 * @returns {Promise<Object>} block and nodeTimestamp
 */
function getBlockByHeight(height) {
  return new Promise((resolve, reject) => {
    api.get('blocks', {height})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        response.data.success && response.data.blocks.count !== 0
          ? resolve({block: response.data.blocks[0], nodeTimestamp: response.data.nodeTimestamp})
          : reject(response.errorMessage);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Get latest blocks with given offset in descending order
 * @param {Number} limit default is 20
 * @param {Number} offset
 * @returns {Promise<Array>}
 */
function getBlocks(offset, limit = 20) {
  return new Promise((resolve, reject) => {
    api.get('blocks', {orderBy: "height:desc", offset, limit})
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
}

/**
 * Get blocks status
 * @returns {Promise<Object>}
 */
function getBlockStatus() {
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
}

/**
 * Get last block
 * @returns {Promise<Object>}
 */
function getLastBlock() {
  return new Promise((resolve, reject) => {
    api.get('blocks', {orderBy: 'height:desc'})
      .then((response) => {
        if (response.details.status !== 200) {
          reject(response.errorMessage);
        }

        if (response.data.blocks < 1) {
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
}

/**
 * Get last blocks for given generator public key and limit
 * @param {String} publicKey
 * @returns {Promise<Array>}
 */
function getLastBlocksByGeneratorPublicKey(publicKey) {
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
}

module.exports = {
  getBlockHeight,
  getBlockById,
  getBlockByHeight,
  getBlocks,
  getBlockStatus,
  getLastBlock,
  getLastBlocksByGeneratorPublicKey,
};
