const { isSupportedApiPath } = require('../helpers/http');

const READINESS_INDEPENDENT_PATHS = new Set(['/api/networkHealth']);

/**
 * Create middleware that delays `/api` requests until the shared
 * ADAMANT API client finishes its startup health check. Operational health
 * requests bypass the wait and report `unavailable` while startup is pending.
 * @param {{isReady: Function, waitForReady: Function}} adamantApi Shared API client
 * @returns {Function} Express middleware
 */
function createAdamantApiReadinessMiddleware(adamantApi) {
  return async function waitForAdamantApiReadiness(req, res, next) {
    const requestPath =
      typeof req.path === 'string' ? req.path : String(req.originalUrl).split('?', 1)[0];

    if (
      !isSupportedApiPath(requestPath) ||
      READINESS_INDEPENDENT_PATHS.has(requestPath) ||
      adamantApi.isReady()
    ) {
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
