/**
 * Create middleware that delays `/api` requests until the shared
 * ADAMANT API client finishes its startup health check.
 * @param {{isReady: Function, waitForReady: Function}} adamantApi Shared API client
 * @returns {Function} Express middleware
 */
function createAdamantApiReadinessMiddleware(adamantApi) {
  return async function waitForAdamantApiReadiness(req, res, next) {
    if (!req.originalUrl.startsWith('/api') || adamantApi.isReady()) {
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
