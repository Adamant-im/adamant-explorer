'use strict';

const blocks = require('../lib/adamant/blocks');

module.exports = function (app) {
  const api = new blocks(app);

  app.get('/api/getLastBlocks', (req, res, next) => {
    api.getLastBlocks(
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
    api.getBlock(
      req.query.blockId,
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
    api.getHeight(
      req.query.height,
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
    api.getBlockStatus(
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
    api.getBlockStatus(
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
