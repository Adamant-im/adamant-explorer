'use strict';

const networkHealthHandler = require('../lib/adamant/handlers/networkHealth');
const { allowQueryParameters } = require('./validation');

/**
 * Mount the operational network-health endpoint.
 * @param {Object} app Express application
 * @param {Function} [getNetworkHealth] Injectable handler for isolated API tests
 */
module.exports = function mountNetworkHealthRoute(
  app,
  getNetworkHealth = networkHealthHandler.getNetworkHealth,
) {
  app.get('/api/networkHealth', allowQueryParameters(), (req, res) => {
    getNetworkHealth(
      (data) => res.status(503).json(data),
      (data) => res.status(200).json(data),
    );
  });
};
