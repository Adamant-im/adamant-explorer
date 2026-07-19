'use strict';

const { isApiPath } = require('../api/lib/adamant/helpers/http');

const DEFAULT_API_RATE_LIMIT = 300;
const DEFAULT_API_RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Add rate-limit metadata to an API response.
 * @param {Object} res Express response
 * @param {number} limit Maximum requests in the current window
 * @param {number} remaining Requests remaining in the current window
 * @param {number} resetAt Window reset time in Unix milliseconds
 * @param {number} now Current time in Unix milliseconds
 * @param {number} windowMs Window duration in milliseconds
 */
function setRateLimitHeaders(res, limit, remaining, resetAt, now, windowMs) {
  const resetAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
  const windowSeconds = Math.ceil(windowMs / 1000);

  res.setHeader('RateLimit-Policy', `${limit};w=${windowSeconds}`);
  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(remaining));
  res.setHeader('RateLimit-Reset', String(resetAfterSeconds));

  // Keep the widely supported legacy fields while clients adopt RateLimit-*.
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
}

/**
 * Create a fixed-window, in-process rate limiter for Explorer API requests.
 *
 * Client identity comes from `req.ip`, so callers must configure Express
 * `trust proxy` before installing this middleware. Entries expire after one
 * window and are removed opportunistically without background timers.
 *
 * @param {Object} [options] Limiter options
 * @param {number} [options.limit=300] Requests allowed per client and window
 * @param {number} [options.windowMs=60000] Window duration in milliseconds
 * @param {() => number} [options.now=Date.now] Clock used by tests
 * @returns {Function} Express middleware
 * @throws {TypeError} When an option is not a positive integer
 */
function createApiRateLimiter({
  limit = DEFAULT_API_RATE_LIMIT,
  windowMs = DEFAULT_API_RATE_LIMIT_WINDOW_MS,
  now = Date.now,
} = {}) {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new TypeError('API rate limit must be a positive safe integer');
  }

  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new TypeError('API rate-limit window must be a positive safe integer');
  }

  if (typeof now !== 'function') {
    throw new TypeError('API rate-limit clock must be a function');
  }

  const clients = new Map();
  let nextSweepAt = 0;

  return function apiRateLimiter(req, res, next) {
    if (!isApiPath(req.path)) {
      return next();
    }

    const currentTime = now();

    if (currentTime >= nextSweepAt) {
      for (const [client, state] of clients) {
        if (state.resetAt <= currentTime) {
          clients.delete(client);
        }
      }

      nextSweepAt = currentTime + windowMs;
    }

    const client = req.ip || req.socket?.remoteAddress || 'unknown';
    let state = clients.get(client);

    if (!state || state.resetAt <= currentTime) {
      state = {
        count: 0,
        resetAt: currentTime + windowMs,
      };
      clients.set(client, state);
    }

    state.count += 1;

    const remaining = Math.max(0, limit - state.count);
    setRateLimitHeaders(res, limit, remaining, state.resetAt, currentTime, windowMs);

    if (state.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((state.resetAt - currentTime) / 1000));
      res.setHeader('Retry-After', String(retryAfter));

      return res.status(429).json({
        success: false,
        error: 'Too many requests',
      });
    }

    return next();
  };
}

module.exports = {
  DEFAULT_API_RATE_LIMIT,
  DEFAULT_API_RATE_LIMIT_WINDOW_MS,
  createApiRateLimiter,
};
