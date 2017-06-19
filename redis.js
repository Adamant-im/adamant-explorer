'use strict';

var redis = require('redis');
var logger = require('./utils/logger');

module.exports = function (config) {
    var client = redis.createClient(
        config.redis.port,
        config.redis.host
    );

    if (config.redis.password) {
        client.auth(config.redis.password, function (err) {
            if (err) {
                logger.info(err);
                logger.info('Can\'t connect to redis');
            }
        });
    }

    return client;
};
