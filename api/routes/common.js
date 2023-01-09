'use strict';

const api = require('../lib/api');

module.exports = function (app) {
  app.get('/api/version', (req, res) => {
    const data = common.version();
    return res.json(data);
  });

  app.get('/api/getPriceTicker', (req, res, next) => {
    common.getPriceTicker(
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
    common.search(
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

  // Private

  const common = new api.common(app, api);
};
