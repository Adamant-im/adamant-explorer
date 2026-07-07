/**
 * API response cache policy.
 *
 * `cacheIgnoreList` — endpoints that must never be cached.
 * `cacheTTLOverride` — per-endpoint TTL in seconds; other endpoints
 * use the `redis.cacheTTL` config value.
 */
module.exports = {
  cacheIgnoreList: [],
  cacheTTLOverride: {
    '/api/getUnconfirmedTransactions': 5,
  },
};
