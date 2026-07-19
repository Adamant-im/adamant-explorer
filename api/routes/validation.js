'use strict';

const { validateQueryKeys } = require('../lib/adamant/helpers/validation');

/**
 * Create middleware that rejects unknown, duplicate, and structured query
 * parameters before they reach Explorer handlers or the ADAMANT Node.
 *
 * Invalid requests deliberately keep the retained API's JSON/HTTP 200 error
 * convention, but bypass the Redis store middleware.
 * @param {...string} allowedKeys Query parameter allowlist
 * @returns {Function} Express middleware
 */
function allowQueryParameters(...allowedKeys) {
  return function validateQuery(req, res, next) {
    const error = validateQueryKeys(req.query, allowedKeys);

    if (!error) {
      return next();
    }

    req.cacheKey = null;
    return res.json({
      success: false,
      error,
    });
  };
}

module.exports = {
  allowQueryParameters,
};
