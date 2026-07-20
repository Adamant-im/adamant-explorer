const transactionsHandler = require('../lib/adamant/handlers/transactions');
const { allowQueryParameters } = require('./validation');

module.exports = function (app) {
  app.get('/api/getTransaction', allowQueryParameters('transactionId'), (req, res, next) => {
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

  app.get('/api/getLastTransfers', allowQueryParameters(), (req, res, next) => {
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

  app.get(
    '/api/getTransactionsByAddress',
    allowQueryParameters('address', 'direction', 'offset', 'limit'),
    (req, res, next) => {
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
    },
  );

  app.get(
    '/api/getTransfersByAddress',
    allowQueryParameters('address', 'direction', 'offset', 'limit'),
    (req, res, next) => {
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
    },
  );

  app.get(
    '/api/getTransactionsByBlock',
    allowQueryParameters('blockId', 'offset', 'limit'),
    (req, res, next) => {
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
    },
  );
};
