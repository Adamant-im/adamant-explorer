var express = require('express'),
    config = require('./config.json').configuration,
    development = config.development,
    production = config.production,
    routes = require("./api"),
    path = require('path'),
    redis = require("redis"),
    client = redis.createClient(
        config.redis.port,
        config.redis.host
    ),
    cache = require('./cache.js')
    async = require('async');

if (config.redis.password) {
    client.auth(config.redis.password, function (err) {
        if (err) {
            console.log(err);
            console.log("Can't connect to redis");
        }
    });
}

var utils = require('./utils'),
    time = utils.time,
    topAccounts = utils.topAccounts;

var app = express();
app.exchange = new utils.exchange(config),

app.configure(function () {
    app.set('strict routing', true);

    app.set("crypti address", "http://" + config.crypti.host + ":" + config.crypti.port);
    app.use(function (req, res, next) {
        req.crypti = app.get("crypti address");
        return next();
    });

    app.use(function (req, res, next) {
        req.time = time;
        return next();
    });

    app.set("fixed point", config.fixedPoint);

    app.use(function (req, res, next) {
        req.redis = client;
        return next();
    });

    setInterval(function () {
        topAccounts(app.get("crypti address"), function (err, accounts) {
            if (err) {
                console.log(err);
            } else {
                app.topAccounts = accounts;
            }
        });
    }, config.updateTopAccountsInterval);

    if (app.exchange.enabled) {
        setInterval(function () {
            app.exchange.loadBTCUSD();
            app.exchange.loadXCRBTC();
        }, config.updateExchangeInterval);
    }

    app.use(express.logger());
    app.use(express.static(path.join(__dirname, "public")));
    app.use(express.compress());
    app.use(express.methodOverride());
    app.use(express.bodyParser());
});

app.configure("development", function () {
    app.set("host", development.host);
    app.set("port", development.port);
});

app.configure("production", function () {
    app.set("host", production.host);
    app.set("port", production.port);
});

app.use(function (req, res, next) {
    if (req.originalUrl.split('/')[1] != 'api') {
        return next();
    }

    console.log(req.originalUrl);

    if (req.originalUrl === undefined) {
        return next();
    }

    if (cache.cacheIgnoreList.indexOf(req.originalUrl) >= 0) {
        return next();
    } else {
        req.redis.get(req.originalUrl, function (err, json) {
            if (err) {
                console.log(err);
                return next();
            } else if (json) {
                try {
                    json = JSON.parse(json);
                } catch (e) {
                    return next();
                }

                return res.json(json);
            } else {
                return next();
            }
        })
    }
});

console.log("Loading routes...");

routes(app);

console.log("Routes loaded");

app.use(function (req, res, next) {
    console.log(req.originalUrl.split('/')[1]);

    if (req.originalUrl.split('/')[1] != 'api') {
        return next();
    }

    if (req.originalUrl === undefined) {
        return next();
    }

    if (cache.cacheIgnoreList.indexOf(req.originalUrl) >= 0) {
        return res.json(req.json);
    } else {
        req.redis.set(req.originalUrl, JSON.stringify(req.json), function (err) {
            if (err) {
                console.log(err);
            } else {
                var ttl = cache.cacheTTLOverride[req.originalUrl] || config.cacheTTL;

                req.redis.send_command('EXPIRE', [req.originalUrl, ttl], function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });

        return res.json(req.json);
    }
});

app.get("*", function (req, res, next) {
    if (req.url.indexOf('api') != 1) {
        return res.sendfile(path.join(__dirname, "public", "index.html"));
    } else {
        return next();
    }
});

async.parallel([
    function (cb) {
        console.log("Getting top accounts...");
        topAccounts(app.get("crypti address"), function (err, accounts) {
            if (err) {
                console.log("Error getting top accounts...");
                cb(err);
            } else {
                app.topAccounts = accounts;
                console.log("Got top accounts!");
                cb();
            }
        });
    },
    function (cb) { app.exchange.getBTCUSD(cb) },
    function (cb) { app.exchange.getXCRBTC(cb) }
], function (err) {
    app.listen(app.get("port"), app.get("host"), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Crypti started at " + app.get("host") + ":" + app.get("port"));
        }
    });
});
