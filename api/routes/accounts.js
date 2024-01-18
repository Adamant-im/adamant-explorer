const accountsHandler = require('../lib/adamant/handlers/accounts');

module.exports = function (app) {
  app.get('/api/getAccount', (req, res, next) => {
    accountsHandler.getAccount(
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
    accountsHandler.getTopAccounts(
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
