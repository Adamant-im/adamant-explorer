const blocks = require('../requests/blocks');
const delegates = require('../requests/delegates');
const helpers = require('../helpers/blocks');
const logger = require('../../../../utils/log');

/**
 * Get last 20 blocks with offset n
 * @param {Number} n
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastBlocks(n, error, success) {
  try {
    const result = {};

    const height = await blocks.getBlockHeight();

    result.pagination = helpers.pagination(n, height);

    result.blocks = await blocks.getBlocks(helpers.offset(n));
    result.blocks = await Promise.all(result.blocks.map(async (b) => {
      b.delegate = await delegates.getDelegate(b.generatorPublicKey);
      return b;
    }));
    result.blocks = helpers.map(result.blocks);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get block by block id
 * @param {Object} params
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getBlock(params, error, success) {
  try {
    let result;
    if (params.blockId) {
      result = await blocks.getBlockById(params.blockId);
    } else if (params.height) {
      result = await blocks.getBlockByHeight(params.height);
    } else {
      return error({
        success: false,
        error: 'Missing/Invalid blockId or height parameter',
      });
    }

    const height = await blocks.getBlockHeight();

    result.block = helpers.makeBody(result.block, height);

    result.block.delegate = await delegates.getDelegate(result.block.generatorPublicKey);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get blocks status
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getBlockStatus(error, success) {
  try {
    const result = await blocks.getBlockStatus();

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

module.exports = {
  getLastBlocks,
  getBlock,
  getBlockStatus,
};
