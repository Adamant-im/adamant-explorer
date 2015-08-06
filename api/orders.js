'use strict';

var orders = require('../lib/api/orders');

module.exports = function (app) {
    var api = new orders(app);

    app.get('/api/orders/getOrders', function (req, res, next) {
        api.getOrders(
            req.query.e,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
};
