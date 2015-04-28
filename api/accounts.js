var accounts = require('../lib/api/accounts');

module.exports = function (app) {
    var api = new accounts(app);

    app.get("/api/getAccount", function (req, res, next) {
        api.getAccount(
            req.query.address,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getTopAccounts", function (req, res, next) {
        api.getTopAccounts(
            { offset : req.query.offset,
              limit  : req.query.limit },
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });
}
