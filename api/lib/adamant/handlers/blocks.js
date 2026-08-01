const blocks = require('../requests/blocks');
const delegates = require('../requests/delegates');
const helpers = require('../helpers/blocks');
const { BLOCK_PAGE_MAX_OFFSET } = require('../constants.mjs');
const { isUnsignedIdentifier, parseIntegerParameter } = require('../helpers/validation');
const logger = require('../../../../utils/log');

/**
 * Get last 20 blocks with offset n
 * @param {Number} n
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastBlocks(n, error, success) {
  let offset;

  try {
    offset = parseIntegerParameter(n, {
      name: 'n',
      defaultValue: 0,
      maximum: BLOCK_PAGE_MAX_OFFSET,
    });
  } catch (err) {
    return error({ success: false, error: err.message });
  }

  try {
    const result = {};

    const height = await blocks.getBlockHeight();

    result.pagination = helpers.pagination(offset, height);

    result.blocks = await blocks.getBlocks(offset);
    result.blocks = await Promise.all(
      result.blocks.map(async (b) => {
        b.delegate = await delegates.getDelegate(b.generatorPublicKey);
        return b;
      }),
    );
    result.blocks = helpers.map(result.blocks);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(`Blocks handler: Failed to load the latest blocks; offset=${offset}: ${err}`);
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
  const hasBlockId = typeof params?.blockId === 'string' && params.blockId.length > 0;
  const hasHeight = params?.height !== undefined && params.height !== '';

  if (hasBlockId === hasHeight) {
    return error({
      success: false,
      error: 'Missing/Invalid blockId or height parameter',
    });
  }

  let lookup;

  if (hasBlockId) {
    if (!isUnsignedIdentifier(params.blockId)) {
      return error({
        success: false,
        error: 'Missing/Invalid blockId parameter',
      });
    }

    lookup = { blockId: params.blockId };
  } else {
    try {
      lookup = {
        height: parseIntegerParameter(params.height, {
          name: 'height',
          minimum: 1,
        }),
      };
    } catch (err) {
      return error({ success: false, error: err.message });
    }
  }

  try {
    let result;

    if (lookup.blockId) {
      result = await blocks.getBlockById(lookup.blockId);
    } else {
      result = await blocks.getBlockByHeight(lookup.height);
    }

    const height = await blocks.getBlockHeight();

    result.block = helpers.makeBody(result.block, height);

    result.block.delegate = await delegates.getDelegate(result.block.generatorPublicKey);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(
      `Blocks handler: Failed to load block details; lookup=${lookup.blockId ? 'id' : 'height'}: ${err}`,
    );
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
    logger.warn(`Blocks handler: Failed to load network status: ${err}`);
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
