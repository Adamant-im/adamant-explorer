const redis = require('redis');
const logger = require('./utils/log');

module.exports = function (config) {
  const client = redis.createClient(
    {
      url: `redis://${config.redis.username}:${config.redis.password}@${config.redis.host}:${config.redis.port}`,
      legacyMode: true,
    },
  );

  client.connect();

  if (config.redis.password) {
    client.auth(config.redis.password, function (err) {
      if (err) {
        logger.error('Can\'t connect to redis: ' + err);
      }
    });
  }

  return client;
};
