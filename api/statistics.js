var statistics = require('../lib/api/statistics');

module.exports = function (app) {
    var api = new statistics(app);

    app.get('/api/statistics/getBestBlock', function (req, res) {
        api.getBestBlock(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getLastBlock', function (req, res) {
        api.getLastBlock(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getVolume', function (req, res) {
        api.getVolume(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getPeers', function (req, res) {
        api.getPeers(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });
}
