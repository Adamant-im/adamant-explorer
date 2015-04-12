var accounts = require('../lib/api/accounts');

module.exports = function (app) {
    app.get("/api/getAccount", function (req, res, next) {
        new accounts(app).getAccount(
            req.query.address,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getTopAccounts", function (req, res, next) {
        new accounts(app).getTopAccounts(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });
}
