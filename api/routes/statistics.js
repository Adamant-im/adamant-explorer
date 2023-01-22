'use strict';

const statisticsHandler = require('../lib/adamant/handlers/statistics');

module.exports = function (app) {
  app.get('/api/statistics/getLastBlock', (req, res) => {
    statisticsHandler.getLastBlock(
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });

  app.get('/api/statistics/getBlocks', (req, res) => {
    statisticsHandler.getBlocks(
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });

  app.get('/api/statistics/getPeers', (req, res) => {
    statisticsHandler.getPeers(
      (data) => {
        res.json(data);
      },
      (data) => {
        res.json(data);
      },
    );
  });
};
