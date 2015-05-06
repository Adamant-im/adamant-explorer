'use strict';

var redis = require("redis");

module.exports = function (config) {
    var client = redis.createClient(
        config.redis.port,
        config.redis.host
    );

    if (config.redis.password) {
        client.auth(config.redis.password, function (err) {
            if (err) {
                console.log(err);
                console.log("Can't connect to redis");
            }
        });
    }

    return client;
}
