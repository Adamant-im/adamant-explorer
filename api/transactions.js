var transactions = require('../lib/api/transactions');

module.exports = function (app) {
    app.get("/api/getTransaction", function (req, res, next) {
        new transactions(app).getTransaction(
            req.query.transactionId,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getUnconfirmedTransactions", function (req, res, next) {
        new transactions(app).getUnconfirmedTransactions(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getLastTransactions", function (req, res, next) {
        new transactions(app).getLastTransactions(
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getTransactionsByAddress", function (req, res, next) {
        new transactions(app).getTransactionsByAddress(
            { address : req.query.address,
              offset  : req.query.offset,
              limit   : req.query.limit },
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });

    app.get("/api/getTransactionsByBlock", function (req, res, next) {
        new api.transactions(app).getTransactionsByBlock(
            req.query.blockId,
            function (data) { res.json(data); },
            function (data) { req.json = data; return next(); }
        );
    });
}
