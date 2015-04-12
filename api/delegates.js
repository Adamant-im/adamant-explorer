var delegates = require('../lib/api/delegates');

module.exports = function (app) {
    var api = new delegates(app);

    app.get("/api/getDelegate", function (req, res, next) {
        api.getDelegate(
            req.query.publicKey,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
