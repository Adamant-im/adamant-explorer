const redis = require('redis');
const logger = require('./utils/log');

/**
 * Create a Redis client used as the API response cache.
 *
 * The connection is established in the background. Cache reads and
 * writes fail gracefully while the client is offline, so the explorer
 * keeps serving requests without cache when Redis is unavailable.
 * @param {Object} config Explorer configuration with a `redis` section
 * @returns {Object} Redis client instance
 */
module.exports = function (config) {
  const { username, password, host, port } = config.redis;

  const client = redis.createClient({
    socket: { host, port },
    username: username || undefined,
    password: password || undefined,
  });

  client.on('error', (error) => {
    logger.warn(
      `Redis cache: Connection error at ${host}:${port}; requests will continue without cache: ${error}`,
    );
  });

  client.on('ready', () => {
    logger.info(`Redis cache: Ready at ${host}:${port}`);
  });

  client.on('reconnecting', () => {
    logger.debug(`Redis cache: Reconnecting to ${host}:${port}`);
  });

  client.connect().catch((error) => {
    logger.warn(
      `Redis cache: Initial connection to ${host}:${port} failed; automatic reconnect remains enabled: ${error}`,
    );
  });

  return client;
};
