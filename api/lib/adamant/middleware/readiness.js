const { isSupportedApiPath } = require('../helpers/http');

/**
 * Create middleware that delays `/api` requests until the shared
 * ADAMANT API client finishes its startup health check.
 * @param {{isReady: Function, waitForReady: Function}} adamantApi Shared API client
 * @returns {Function} Express middleware
 */
function createAdamantApiReadinessMiddleware(adamantApi) {
  return async function waitForAdamantApiReadiness(req, res, next) {
    const requestPath =
      typeof req.path === 'string' ? req.path : String(req.originalUrl).split('?', 1)[0];

    if (!isSupportedApiPath(requestPath) || adamantApi.isReady()) {
      return next();
    }

    try {
      await adamantApi.waitForReady();
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = createAdamantApiReadinessMiddleware;
