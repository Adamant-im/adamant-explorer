'use strict';

const { classifyNetworkHealth, getNetworkHealthSnapshot } = require('../helpers/networkHealth');
const { ACTIVE_DELEGATES } = require('../constants.mjs');
const logger = require('../../../../utils/log');

/**
 * Build the monitoring response from one coherent forging snapshot.
 *
 * The endpoint intentionally returns only its documented monitoring fields,
 * never the broader Node status or error response.
 * @param {Function} error Callback for an unavailable response
 * @param {Function} success Callback for a computed response
 * @param {Object} [dependencies] Test-only dependency overrides
 * @param {Function} [dependencies.getSnapshot] Coherent snapshot provider
 * @param {Function} [dependencies.now] Current time provider
 * @returns {Promise<*>} Result of the invoked callback
 */
async function getNetworkHealth(error, success, dependencies = {}) {
  const getSnapshot = dependencies.getSnapshot ?? getNetworkHealthSnapshot;
  const now = dependencies.now ?? (() => new Date());

  try {
    const snapshot = await getSnapshot();

    return success({
      success: true,
      status: classifyNetworkHealth(snapshot.forgingDelegates),
      height: snapshot.height,
      forgingDelegates: snapshot.forgingDelegates,
      activeDelegates: ACTIVE_DELEGATES,
      checkedAt: now().toISOString(),
    });
  } catch (err) {
    logger.warn(`Network health: Could not produce a coherent snapshot: ${err}`);

    return error({
      success: false,
      status: 'unavailable',
      height: null,
      forgingDelegates: null,
      activeDelegates: ACTIVE_DELEGATES,
      checkedAt: now().toISOString(),
    });
  }
}

module.exports = {
  getNetworkHealth,
};
