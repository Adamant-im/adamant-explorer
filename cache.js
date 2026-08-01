/**
 * API response cache policy.
 *
 * `cacheIgnoreList` — endpoints that must never be cached
 * `cacheByBlockList` — volatile endpoints whose keys include the trusted
 * process-wide latest block identity
 * `cacheTTLOverride` — per-endpoint TTL in seconds; other endpoints
 * use the `redis.cacheTTL` config value
 */
const cacheIgnoreList = ['/api/networkHealth'];
const cacheByBlockList = ['/api/getLastBlocks', '/api/getLastTransfers'];
const cacheTTLOverride = {};

/**
 * Check whether an HTTP method has GET-compatible API cache semantics.
 *
 * Express automatically routes HEAD requests through GET handlers and strips
 * their bodies, so both methods must traverse the same lookup/store path.
 * @param {string} method HTTP request method
 * @returns {boolean} Whether the method may use the response cache
 */
function isApiCacheMethod(method) {
  return method === 'GET' || method === 'HEAD';
}

/**
 * Build the Redis key for one Explorer API request.
 *
 * Block-sensitive endpoints bypass the cache until the trusted accumulator
 * has a block. Once available, its height and id prevent previous-chain data
 * from being returned after the next block or a same-height fork replacement.
 *
 * @param {string} originalUrl Request path including its query string
 * @param {string} requestPath Request path without its query string
 * @param {{id?: string, height: number}} [latestBlock] Latest trusted block
 * @returns {string|null} Redis key, or `null` when the request must bypass cache
 */
function getCacheKey(originalUrl, requestPath, latestBlock) {
  if (cacheIgnoreList.includes(requestPath)) {
    return null;
  }

  if (cacheByBlockList.includes(requestPath)) {
    const height = Number(latestBlock?.height);

    if (!Number.isSafeInteger(height) || height < 1) {
      return null;
    }

    const id = latestBlock?.id ? `:${latestBlock.id}` : '';
    return `block:${height}${id}:${originalUrl}`;
  }

  return originalUrl;
}

module.exports = {
  cacheByBlockList,
  cacheIgnoreList,
  cacheTTLOverride,
  getCacheKey,
  isApiCacheMethod,
};
