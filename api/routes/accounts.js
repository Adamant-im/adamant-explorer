const accountsHandler = require('../lib/adamant/handlers/accounts');
const { allowQueryParameters } = require('./validation');

module.exports = function (app) {
  app.get('/api/getAccount', allowQueryParameters('address', 'publicKey'), (req, res, next) => {
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

  app.get('/api/getTopAccounts', allowQueryParameters('offset', 'limit'), (req, res) => {
    accountsHandler.getTopAccounts(
      req.query,
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });
};
