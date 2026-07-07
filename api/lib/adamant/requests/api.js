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
module.exports = new AdamantApi({
  nodes: config.nodes_adm,
  minVersion: MIN_NODE_VERSION,
  logLevel: config.log_level,
  logger,
});
