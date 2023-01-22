'use strict';

const blocks = require('../requests/blocks');
const statistics = require('../requests/statistics');
const helpers = require('../helpers/statistics');
const logger = require('../../../../utils/log');

const locator = new helpers.Locator();

/**
 * Get last block
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>} */
async function getLastBlock(error, success) {
  try {
    const result = {};

    result.block = await blocks.getLastBlock();

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get recent blocks statistics
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getBlocks(error, success) {
  try {
    const blocksStatistics = new helpers.BlocksStatistics();
    const limit = 100;

    let offset = 0;

    do {
      const data = await blocks.getBlocks(offset, limit);
      blocksStatistics.inspect(data, offset);
      offset += limit;
    } while (offset <= blocksStatistics.maxOffset);

    const result = {};

    result.best = blocksStatistics.best.block;
    result.volume = blocksStatistics.volume;

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get peers information
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getPeers(error, success) {
  try {
    const peersStatistics = new helpers.PeersStatistics(locator);
    const limit = 100;

    let offset = 0;
    let found = false;

    do {
      const data = await statistics.getPeers(offset, limit);

      if (data.length > 0) {
        peersStatistics.collect(data);
      } else {
        found = true;
      }

      offset += limit;
    } while (!(found || offset > peersStatistics.maxOffset));

    const result = {};

    result.list= peersStatistics.list;

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

module.exports = {
  getLastBlock,
  getBlocks,
  getPeers,
  locator,
};
