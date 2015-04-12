var statistics = require('../lib/api/statistics');

module.exports = function (app) {
    var statistics = new statistics(app);

    app.get('/api/statistics/getBestBlock', function (req, res) {
        statistics.getBestBlock(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getLastBlock', function (req, res) {
        statistics.getLastBlock(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getVolume', function (req, res) {
        statistics.getVolume(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });

    app.get('/api/statistics/getPeers', function (req, res) {
        statistics.getPeers(
            function (data) { res.json(data); },
            function (data) { res.json(data); }
        );
    });
}
