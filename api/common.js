'use strict';

var api = require('../lib/api');

module.exports = function (app) {
    app.get('/api/version', function (req, res) {
        var data = common.version();
        return res.json(data);
    });

    app.get('/api/getPriceTicker', function (req, res, next) {
        common.getPriceTicker(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/search', function (req, res, next) {
        common.search(
            req.query.id,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    // Private

    var common = new api.common(app, api);
};
