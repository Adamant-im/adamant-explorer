'use strict';

var candles = require('../lib/api/candles');

module.exports = function (app) {
    var api = new candles(app);

    app.get('/api/candles/getCandles', function (req, res, next) {
        api.getCandles(
            { e: req.query.e, d: req.query.d },
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/candles/getStatistics', function (req, res, next) {
        api.getStatistics(
            req.query.e,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
};
