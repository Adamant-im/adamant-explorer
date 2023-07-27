const blocks = require('../requests/blocks');
const delegates = require('../requests/delegates');
const transactions = require('../requests/transactions');
const helpers = require('../helpers/delegates');
const logger = require('../../../../utils/log');

/**
 * Get active delegates info
 * @param error
 * @param success
 * @returns {Promise<*>}
 */
async function getActive(error, success) {
  try {
    const result = await delegates.getActive();
    result.delegates = helpers.parseDelegates(result.delegates);
    result.delegates = await Promise.all(result.delegates.map(async (delegate) => {
      delegate.forged = await delegates.getForged(delegate.publicKey);
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
}

/**
 * Get standby delegates with given offset n
 * @param {Number} n
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getStandby(n, error, success) {
  try {
    const limit = 20;
    const offset = parseInt(n);
    const actualOffset = (isNaN(offset)) ? 101 : offset + 101;

    const result = await delegates.getStandby(actualOffset, limit);

    result.delegates = helpers.parseDelegates(result.delegates);
    result.totalCount = (result.totalCount - 101);
    result.pagination = helpers.pagination(result.totalCount, offset, limit);

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
 * Get latest delegate registrations
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLatestRegistrations (error, success) {
  try {
    const result = {};

    result.transactions = await transactions.getRegistrationTransactions();

    result.transactions = await Promise.all(result.transactions.map(async (tx) => {
      tx.delegate = await delegates.getDelegate(tx.senderPublicKey, true);
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
}

/**
 * Get latest votes
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLatestVotes(error, success) {
  try {
    const result = {};

    result.transactions = await transactions.getVoteTransactions();

    result.transactions = await Promise.all(result.transactions.map(async (tx) => {
      tx.delegate = await delegates.getDelegate(tx.senderPublicKey);
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
}

/**
 * Get last block info
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastBlock(error, success) {
  try {
    const result = {};

    result.block = await blocks.getLastBlock();

    result.block.delegate = await delegates.getDelegate(result.block.generatorPublicKey);

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
 * Get last blocks info for given public key and limit (optional)
 * @param params e.g. {publicKey: "abc123...", limit: 5}
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastBlocks(params, error, success) {
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
    result.blocks = await blocks.getLastBlocksByGeneratorPublicKey(params.publicKey);
    result.blocks = result.blocks.slice(0, params.limit);

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
 * Get delegate address by username
 * @param {String} params e.g. 'adm_official_pool'
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getSearch(params, error, success) {
  try {
    if (!params || !params.match(/^(?![0-9]{1,21}[L]$)[0-9a-z.]+/i)) {
      return error({
        success: false,
        error: 'Missing/Invalid username parameter',
      });
    }

    const result = {};

    result.address = await delegates.getSearch(params);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.log(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 * Get next forgers info
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getNextForgers(error, success) {
  try {
    const result = {};

    result.delegates = await delegates.getNextForgers();

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
  getActive,
  getStandby,
  getLatestRegistrations,
  getLatestVotes,
  getLastBlock,
  getLastBlocks,
  getSearch,
  getNextForgers,
};
