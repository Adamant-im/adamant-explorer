var delegates = require('../lib/api/delegates');

module.exports = function (app) {
    var api = new delegates(app);

    app.get("/api/delegates/getActive", function (req, res, next) {
        api.getActive(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/delegates/getStandby", function (req, res, next) {
        api.getStandby(
            req.query.n,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/delegates/getLatestRegistrations", function (req, res, next) {
        api.getLatestRegistrations(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/delegates/getLatestVotes", function (req, res, next) {
        api.getLatestVotes(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/delegates/getLastBlock", function (req, res, next) {
        api.getLastBlock(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
