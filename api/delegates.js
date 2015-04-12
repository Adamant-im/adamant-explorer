var delegates = require('../lib/api/delegates');

module.exports = function (app) {
    app.get("/api/getDelegate", function (req, res, next) {
        new delegates(app).getDelegate(
            req.query.publicKey,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
