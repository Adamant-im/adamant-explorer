'use strict';

const accountsHandler = require('./accounts');
const blocksHandler = require('./blocks');
const delegatesHandler = require('./delegates');
const transactionsHandler = require('./transactions');
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
  try {
    if (!id) {
      return error({
        success: false,
        error: 'Missing/Invalid search criteria',
      });
    }

    if (id.match(/^[U|u][0-9]{1,21}$/g)) {
      return accountsHandler.getAccount({address: id}, () => {
        return error({success: false, error: null, found: false});
      }, (response) => {
        return success({success: true, type: 'address', id: response.address});
      });
    }

    if (id.match(/^([A-Fa-f0-9]{2}){32}$/g)) {
      return accountsHandler.getAccount({publicKey: id}, () => {
        return error({success: false, error: null, found: false});
      }, (response) => {
        return success({success: true, type: 'address', id: response.address});
      });
    }

    if (!isNaN(id)) {
      return blocksHandler.getBlock({blockId: id}, () => {
          return transactionsHandler.getTransaction(id, () => {
            return blocksHandler.getBlock({height: id}, () => {
              return error({success: false, error: null, found: false});
            }, (response) => {
              return success({success: true, type: 'block', id: response.block.id});
            });
          }, (response) => {
            return success({success: true, type: 'tx', id: response.transaction.id});
          });
        },
        (response) => {
          return success({success: true, type: 'block', id: response.block.id});
        });
    } else {
      return delegatesHandler.getSearch(id, () => {
          return error({success: false, error: null, found: false});
        },
        (response) => {
          return success({success: true, type: 'address', id: response.address});
        });
    }
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: err,
    });
  }
}

/**
 *
 * @param {Boolean}isEnabled
 * @param {Object} exchange
 * @param {Function} error
 * @param {Function} success
 * @returns {Object}
 */
function getPriceTicker(isEnabled, exchange, error, success) {
  if (isEnabled) {
    return success({
      success: true,
      ticker: exchange,
    });
  } else {
    return success({
      success: false,
      error: 'Exchange rates are disabled',
    });
  }
}

module.exports = {
  version,
  search,
  getPriceTicker,
};
