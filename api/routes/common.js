'use strict';

const commonHandler = require('../lib/adamant/handlers/common');

module.exports = function (app) {
  app.get('/api/version', (req, res) => {
    const data = commonHandler.version(app);
    return res.json(data);
  });

  app.get('/api/getPriceTicker', (req, res, next) => {
    commonHandler.getPriceTicker(
      app.get('exchange enabled'),
      app.exchange,
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/search', (req, res, next) => {
    commonHandler.search(
      req.query.id,
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
