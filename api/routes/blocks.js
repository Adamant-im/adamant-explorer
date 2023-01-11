'use strict';

const blocksHandler = require('../lib/adamant/handlers/blocks');

module.exports = function (app) {
  app.get('/api/getLastBlocks', (req, res, next) => {
    blocksHandler.getLastBlocks(
      req.query.n,
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/getBlock', (req, res, next) => {
    blocksHandler.getBlock(
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

  app.get('/api/getHeight', (req, res, next) => {
    blocksHandler.getBlock(
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

  app.get('/api/getBlockStatus', (req, res, next) => {
    blocksHandler.getBlockStatus(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/totalSupply', (req, res, next) => {
    blocksHandler.getBlockStatus(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data.supply / 100000000;
        return next();
      },
    );
  });
};
