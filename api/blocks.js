var blocks = require('../lib/api/blocks');

module.exports = function (app) {
    var api = new blocks(app);

    app.get("/api/getBlocksCount", function (req, res, next) {
        api.getBlocksCount(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/lastBlocks", function (req, res, next) {
        api.lastBlocks(
            req.query.n,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getBlock", function (req, res, next) {
        api.getBlock(
            req.query.blockId,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
