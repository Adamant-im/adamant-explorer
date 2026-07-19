const accountsHandler = require('./accounts');
const blocksHandler = require('./blocks');
const delegatesHandler = require('./delegates');
const transactionsHandler = require('./transactions');
const {
  isAdamantAddress,
  isDelegateSearch,
  isPublicKey,
  isUnsignedIdentifier,
  normalizeAdamantAddress,
} = require('../helpers/validation');
const logger = require('../../../../utils/log');

/**
 * Get app version
 * @param {Object} app
 * @returns {Object}
 */
function version(app) {
  return {
    version: app.get('version'),
  };
}

/**
 * Accepts one id and tries to get information for it
 * @param {String} id
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function search(id, error, success) {
  if (typeof id !== 'string' || !id.length || id.length > 64) {
    return error({
      success: false,
      error: 'Missing/Invalid search criteria',
    });
  }

  try {
    if (isAdamantAddress(id)) {
      return accountsHandler.getAccount(
        { address: normalizeAdamantAddress(id) },
        () => {
          return error({ success: false, error: null, found: false });
        },
        (response) => {
          return success({ success: true, type: 'address', id: response.address });
        },
      );
    }

    if (isPublicKey(id)) {
      return accountsHandler.getAccount(
        { publicKey: id.toLowerCase() },
        () => {
          return error({ success: false, error: null, found: false });
        },
        (response) => {
          return success({ success: true, type: 'address', id: response.address });
        },
      );
    }

    if (isUnsignedIdentifier(id)) {
      return blocksHandler.getBlock(
        { blockId: id },
        () => {
          return transactionsHandler.getTransaction(
            id,
            () => {
              return blocksHandler.getBlock(
                { height: id },
                () => {
                  return error({ success: false, error: null, found: false });
                },
                (response) => {
                  return success({ success: true, type: 'block', id: response.block.id });
                },
              );
            },
            (response) => {
              return success({ success: true, type: 'tx', id: response.transaction.id });
            },
          );
        },
        (response) => {
          return success({ success: true, type: 'block', id: response.block.id });
        },
      );
    }

    if (isDelegateSearch(id)) {
      return delegatesHandler.getSearch(
        id,
        () => {
          return error({ success: false, error: null, found: false });
        },
        (response) => {
          return success({ success: true, type: 'address', id: response.address });
        },
      );
    }

    return error({
      success: false,
      error: 'Missing/Invalid search criteria',
    });
  } catch (err) {
    logger.warn(`Search handler: Unexpected lookup failure; criteria omitted from logs: ${err}`);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get the latest known exchange rates.
 * @param {boolean} isEnabled Whether the exchange rates service is enabled
 * @param {Object} exchange Exchange rates service instance
 * @param {Function} error Callback for the error response
 * @param {Function} success Callback for the success response
 * @returns {Object} Result of the invoked callback
 */
function getPriceTicker(isEnabled, exchange, error, success) {
  if (isEnabled) {
    return success({
      success: true,
      tickers: exchange.tickers,
    });
  }

  return success({
    success: false,
    error: 'Exchange rates are disabled',
  });
}

module.exports = {
  version,
  search,
  getPriceTicker,
};
