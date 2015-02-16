var api = require('../lib/api');

module.exports = function (app) {
    app.get("/api/getBlocksCount", function (req, res, next) {
        new api.blocks(app).getBlocksCount(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/lastBlocks", function (req, res, next) {
        new api.blocks(app).lastBlocks(
            req.query.n,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getBlock", function (req, res, next) {
        new api.blocks(app).getBlock(
            req.query.blockId,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
