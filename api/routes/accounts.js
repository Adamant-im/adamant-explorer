'use strict';

const accounts = require('../lib/adamant/accounts');
const accountsnew = require('../lib/adamant/handlers/accounts');

module.exports = function (app) {
  const api = new accounts(app);

  app.get('/api/getAccount', (req, res, next) => {
    accountsnew.getAccount(
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
    accountsnew.getTopAccounts(
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
