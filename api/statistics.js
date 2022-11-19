'use strict';

const statistics = require('../lib/api/statistics');

module.exports = function (app) {
  const api = new statistics(app);

  app.get('/api/statistics/getLastBlock', (req, res) => {
    api.getLastBlock(
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });

  app.get('/api/statistics/getBlocks', (req, res) => {
    api.getBlocks(
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });

  app.get('/api/statistics/getPeers', (req, res) => {
    api.getPeers(
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });
};
