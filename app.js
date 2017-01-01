'use strict';

var express = require('express'),
    config = require('./config.json').configuration,
    client = require('./redis')(config),
    development = config.development,
    production = config.production,
    routes = require('./api'),
    path = require('path'),
    cache = require('./cache'),
    async = require('async');

var app = express(), utils = require('./utils');

app.candles = new utils.candles(config, client);
app.exchange = new utils.exchange(config);
app.knownAddresses = new utils.knownAddresses();
app.orders = new utils.orders(config, client);

app.set('version', '0.3');
app.set('strict routing', true);
app.set('lisk address', 'http://' + config.lisk.host + ':' + config.lisk.port);
app.set('freegeoip address', 'http://' + config.freegeoip.host + ':' + config.freegeoip.port);
app.set('fixed point', config.fixedPoint);
app.set('exchange enabled', config.enableExchange);
app.set('candles enabled', config.enableCandles);
app.set('orders enabled', config.enableOrders);

app.use (function (req, res, next) {
    res.setHeader ('X-Frame-Options', 'DENY');
    res.setHeader ('X-Content-Type-Options', 'nosniff');
    res.setHeader ('X-XSS-Protection', '1; mode=block');
    var ws_src = 'ws://' + req.get('host') + ' wss://' + req.get('host');
    res.setHeader ('Content-Security-Policy', 'frame-ancestors \'none\'; default-src \'self\'; connect-src \'self\' ' + ws_src + '; img-src \'self\' https://*.tile.openstreetmap.org; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src \'self\' https://fonts.gstatic.com');
    return next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.locals.redis = client;
app.use(function (req, res, next) {
    req.redis = client;
    return next();
});

var morgan = require('morgan');
app.use(morgan('combined'));
var compression = require('compression');
app.use(compression());
var methodOverride = require('method-override');
app.use(methodOverride('X-HTTP-Method-Override'));

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};
app.use(allowCrossDomain);

if (process.env.NODE_ENV === 'production') {
    app.set('host', production.host);
    app.set('port', production.port);
} else {
    app.set('host', development.host);
    app.set('port', development.port);
}

app.use(function (req, res, next) {
    if (req.originalUrl.split('/')[1] !== 'api') {
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
        });
    }
});

console.log('Loading routes...');

routes(app);

console.log('Routes loaded');

app.use(function (req, res, next) {
    console.log(req.originalUrl.split('/')[1]);

    if (req.originalUrl.split('/')[1] !== 'api') {
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

app.get('*', function (req, res, next) {
    if (req.url.indexOf('api') !== 1) {
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        return next();
    }
});

async.parallel([
    function (cb) { app.exchange.loadBTCUSD(cb); },
    function (cb) { app.exchange.loadLISKBTC(cb); }
], function (err) {
    var server = app.listen(app.get('port'), app.get('host'), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('Lisk started at ' + app.get('host') + ':' + app.get('port'));

            var io = require('socket.io').listen(server);
            require('./sockets')(app, io);
        }
    });
});
