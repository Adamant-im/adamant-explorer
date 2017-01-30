'use strict';

var config  = require ('../config'),
	candles = require ('../lib/api/candles'),
	orders  = require ('../lib/api/orders');

module.exports = function (app) {
	var ordersApi = new orders(app),
		candlesApi = new candles(app);

    app.get('/api/exchanges', function (req, res) {
        var result = {
			success: true,
			enabled: config.marketWatcher.enabled,
			exchanges: config.marketWatcher.enabled ? config.marketWatcher.exchanges : []
        };
        return res.json(result);
    });

    app.get('/api/exchanges/getOrders', function (req, res, next) {
        ordersApi.getOrders(
			req.query.e,
			function (data) { res.json(data); },
			function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/exchanges/getCandles', function (req, res, next) {
        candlesApi.getCandles(
			{ e: req.query.e, d: req.query.d },
			function (data) { res.json(data); },
			function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/exchanges/getStatistics', function (req, res, next) {
        candlesApi.getStatistics(
            req.query.e,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
};
