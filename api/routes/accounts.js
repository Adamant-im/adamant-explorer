'use strict';

const accounts = require('../lib/api/accounts');

module.exports = function (app) {
  const api = new accounts(app);

  app.get('/api/getAccount', (req, res, next) => {
    api.getAccount(
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

  app.get('/api/getTopAccounts', (req, res, next) => {
    api.getTopAccounts(
      {
        offset: req.query.offset,
        limit: req.query.limit,
      },
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });
};
