var api = require('../lib/api');

module.exports = function (app) {
    app.get('/api/statistics/getBestBlock', function (req, res) {
        new api.statistics(app).getBestBlock(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getLastBlock', function (req, res) {
        new api.statistics(app).getLastBlock(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getVolume', function (req, res) {
        new api.statistics(app).getVolume(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getPeers', function (req, res) {
        new api.statistics(app).getPeers(
            req.query.address,
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });
}
