'use strict';

var delegates = require('../lib/api/delegates');

module.exports = function (app) {
    var api = new delegates(app);

    app.get('/api/delegates/getActive', function (req, res, next) {
        api.getActive(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/delegates/getStandby', function (req, res, next) {
        api.getStandby(
            req.query.n,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/delegates/getLatestRegistrations', function (req, res, next) {
        api.getLatestRegistrations(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/delegates/getLatestVotes', function (req, res, next) {
        api.getLatestVotes(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/delegates/getLastBlock', function (req, res, next) {
        api.getLastBlock(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/delegates/getLastBlocks', function (req, res, next) {
        api.getLastBlocks(
            { publicKey : req.query.publicKey,
              limit : req.query.limit },
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getSearch', function (req, res, next) {
        api.getSearch(
            req.query.q,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
	);
    });

    app.get('/api/delegates/getNextForgers', function (req, res, next) {
        api.getNextForgers(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/delegates/getDelegateProposals', function (req, res, next) {
        api.getDelegateProposals(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
};
