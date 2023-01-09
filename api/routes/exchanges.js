'use strict';

const config = require('../../modules/configReader');
const candles = require('../lib/adamant/candles');
const orders = require('../lib/adamant/orders');

module.exports = function (app) {
  const ordersApi = new orders(app);
  const candlesApi = new candles(app);

  app.get('/api/exchanges', (req, res) => {
    const result = {
      success: true,
      enabled: config.marketWatcher.enabled,
      exchanges: config.marketWatcher.enabled
        ? config.marketWatcher.exchanges
        : [],
    };
    return res.json(result);
  });

  app.get('/api/exchanges/getOrders', (req, res, next) => {
    ordersApi.getOrders(
      req.query.e,
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/exchanges/getCandles', (req, res, next) => {
    candlesApi.getCandles(
      { e: req.query.e, d: req.query.d },
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/exchanges/getStatistics', (req, res, next) => {
    candlesApi.getStatistics(
      req.query.e,
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
