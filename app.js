var express = require("express"),
    config = require("./config.json").configuration,
    client = require("./redis")(config),
    development = config.development,
    production = config.production,
    routes = require("./api"),
    path = require("path"),
    cache = require("./cache")
    async = require("async");

var app = express(), utils = require("./utils");

app.exchange = new utils.exchange(config),
app.knownAddresses = new utils.knownAddresses();
app.knownAddresses.load();

app.configure(function () {
    app.set("version", "0.3");

    app.set("strict routing", true);

    app.set("crypti address", "http://" + config.crypti.host + ":" + config.crypti.port);
    app.set("freegeoip address", "http://" + config.freegeoip.host + ":" + config.freegeoip.port);

    app.set("fixed point", config.fixedPoint);

    app.use(function (req, res, next) {
        req.redis = client;
        return next();
    });

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
    if (req.originalUrl.split("/")[1] != "api") {
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
    console.log(req.originalUrl.split("/")[1]);

    if (req.originalUrl.split("/")[1] != "api") {
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

                req.redis.send_command("EXPIRE", [req.originalUrl, ttl], function (err) {
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
    if (req.url.indexOf("api") != 1) {
        return res.sendfile(path.join(__dirname, "public", "index.html"));
    } else {
        return next();
    }
});

async.parallel([
    function (cb) { app.exchange.loadBTCUSD(cb) },
    function (cb) { app.exchange.loadXCRBTC(cb) }
], function (err) {
    var server = app.listen(app.get("port"), app.get("host"), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Crypti started at " + app.get("host") + ":" + app.get("port"));

            var io = require("socket.io").listen(server);
            require("./sockets")(app, io);
        }
    });
});
