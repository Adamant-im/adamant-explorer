'use strict';

const { isApiPath, isSupportedApiPath } = require('../api/lib/adamant/helpers/http');

/**
 * Reject requests outside the intentionally supported Explorer API surface.
 *
 * This guard must run before Redis lookup and ADAMANT readiness middleware so
 * stale cache entries cannot revive removed routes and unknown routes never
 * wait on upstream node availability.
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Function} next Express continuation
 * @returns {*} Middleware result
 */
function guardApiSurface(req, res, next) {
  if (!isApiPath(req.path)) {
    return next();
  }

  if (!['GET', 'HEAD'].includes(req.method) || !isSupportedApiPath(req.path)) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
    });
  }

  return next();
}

module.exports = {
  guardApiSurface,
};
