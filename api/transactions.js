'use strict';

var transactions = require('../lib/api/transactions');

module.exports = function (app) {
    var api = new transactions(app);

    app.get('/api/getTransaction', function (req, res, next) {
        api.getTransaction(
            req.query.transactionId,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getUnconfirmedTransactions', function (req, res, next) {
        api.getUnconfirmedTransactions(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getLastTransactions', function (req, res, next) {
        api.getLastTransactions(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getTransactionsByAddress', function (req, res, next) {
        api.getTransactionsByAddress(
            { address : req.query.address,
              offset  : req.query.offset,
              limit   : req.query.limit },
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get('/api/getTransactionsByBlock', function (req, res, next) {
        api.getTransactionsByBlock(
          { blockId : req.query.blockId,
            offset  : req.query.offset,
            limit   : req.query.limit },
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
};

