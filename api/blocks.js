'use strict';

var blocks = require('../lib/api/blocks');

module.exports = function (app) {
    var api = new blocks(app);

    app.get('/api/getLastBlocks', function (req, res, next) {
        api.getLastBlocks(
            req.query.n,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getBlock', function (req, res, next) {
        api.getBlock(
            req.query.blockId,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getHeight', function (req, res, next) {
        api.getHeight(
            req.query.height,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getBlockStatus', function (req, res, next) {
        api.getBlockStatus(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
};
