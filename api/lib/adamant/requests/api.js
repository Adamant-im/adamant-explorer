const { AdamantApi } = require('adamant-api');
const config = require('../../../../modules/configReader');
const logger = require('../../../../utils/log');

// The explorer targets the ADAMANT Node v0.10.0 API;
// older nodes are excluded from selection during health checks
const MIN_NODE_VERSION = '0.10.0';

/**
 * Shared ADAMANT node API client.
 *
 * The client performs node health checks, selects a synchronized node,
 * and fails GET requests over to another healthy node when it is safe.
 * All responses are normalized by the SDK to either a success payload
 * or `{ success: false, errorMessage }`.
 */
const api = new AdamantApi({
  nodes: config.nodes_adm,
  minVersion: MIN_NODE_VERSION,
  logLevel: config.log_level,
  logger,
});

let isReady = false;

const readyPromise = new Promise((resolve) => {
  api.onReady(() => {
    isReady = true;
    resolve();
  });
});

/**
 * Wait until the SDK finishes its startup health check.
 *
 * The SDK fires `onReady` after the first health-check pass, even when no
 * node is usable, so callers can start their own retry loops without racing
 * the initial node selection.
 * @returns {Promise<void>} Resolves after the first SDK health check completes
 */
api.waitForReady = function waitForReady() {
  return readyPromise;
};

/**
 * Check whether the first SDK health-check pass has completed.
 * @returns {boolean} `true` once startup node initialization has finished
 */
api.isReady = function apiIsReady() {
  return isReady;
};

module.exports = api;
