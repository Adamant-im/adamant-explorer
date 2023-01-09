'use strict';

const transactions = require('../lib/api/transactions');

module.exports = function (app) {
  const api = new transactions(app);

  app.get('/api/getTransaction', (req, res, next) => {
    api.getTransaction(
      req.query.transactionId,
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/getUnconfirmedTransactions', (req, res, next) => {
    api.getUnconfirmedTransactions(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/getLastTransactions', (req, res, next) => {
    api.getLastTransactions(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/getLastTransfers', (req, res, next) => {
    api.getLastTransfers(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/getTransactionsByAddress', (req, res, next) => {
    api.getTransactionsByAddress(
      req.query,
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });
  app.get('/api/getTransfersByAddress', (req, res, next) => {
    api.getTransactionsByAddress(
      req.query,
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
      1,
    );
  });

  app.get('/api/getTransactionsByBlock', (req, res, next) => {
    api.getTransactionsByBlock(
      {
        blockId: req.query.blockId,
        offset: req.query.offset,
        limit: req.query.limit,
      },
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });
};
