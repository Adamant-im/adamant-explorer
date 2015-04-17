var delegates = require('../lib/api/delegates');

module.exports = function (app) {
    var api = new delegates(app);

    app.get("/api/delegates/getActive", function (req, res, next) {
        api.getActive(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
