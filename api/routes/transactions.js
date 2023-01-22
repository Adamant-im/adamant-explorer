'use strict';

const transactionsHandler = require('../lib/adamant/handlers/transactions');

module.exports = function (app) {
  app.get('/api/getTransaction', (req, res, next) => {
    transactionsHandler.getTransaction(
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
    transactionsHandler.getUnconfirmedTransactions(
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
    transactionsHandler.getLastTransactions(
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
    transactionsHandler.getLastTransfers(
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
    transactionsHandler.getTransactionsByAddress(
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
    transactionsHandler.getTransfersByAddress(
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

  app.get('/api/getTransactionsByBlock', (req, res, next) => {
    transactionsHandler.getTransactionsByBlock(
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
