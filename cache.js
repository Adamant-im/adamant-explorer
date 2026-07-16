/**
 * API response cache policy.
 *
 * `cacheIgnoreList` — endpoints that must never be cached.
 * `cacheTTLOverride` — per-endpoint TTL in seconds; other endpoints
 * use the `redis.cacheTTL` config value.
 */
module.exports = {
  // Process-wide peer statistics already have their own live Redis-backed cache.
  cacheIgnoreList: ['/api/statistics/getPeers'],
  cacheTTLOverride: {
    '/api/getUnconfirmedTransactions': 5,
  },
};
