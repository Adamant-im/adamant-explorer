const api = require("./api");

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
 * Get 20 latest blocks with given offset in descending order
 * @param {Number} offset
 * @returns {Promise<Array>}
 */
function getBlocks(offset) {
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


module.exports = {
  getBlockHeight,
  getBlockById,
  getBlockByHeight,
  getBlocks,
  getBlockStatus,
};
