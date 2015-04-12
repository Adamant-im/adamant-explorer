var common = require('../lib/api/common');

module.exports = function (app) {
    app.get("/api/version", function (req, res) {
        var data = new common(app).version();
        return res.json(data);
    });

    app.get("/api/getFee", function (req, res, next) {
        new common(app).getFee(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getXCRCourse", function (req, res, next) {
        var data = new common(app).getXCRCourse();
        return res.json(data);
    });

    app.get("/api/search", function (req, res, next) {
        new common(app, api).search(
            req.query.id,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
