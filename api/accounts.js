var api = require('../lib/api');

module.exports = function (app) {
    app.get("/api/getAccount", function (req, res, next) {
        new api.accounts(app).getAccount(
            req.query.address,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getTopAccounts", function (req, res, next) {
        new api.accounts(app).getTopAccounts(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });
}
