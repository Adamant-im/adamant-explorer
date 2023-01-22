'use strict';

const delegatesHandler = require('../lib/adamant/handlers/delegates');

module.exports = function (app) {

  app.get('/api/delegates/getActive', (req, res, next) => {
    delegatesHandler.getActive(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/delegates/getStandby', (req, res, next) => {
    delegatesHandler.getStandby(
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

  app.get('/api/delegates/getLatestRegistrations', (req, res, next) => {
    delegatesHandler.getLatestRegistrations(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/delegates/getLatestVotes', (req, res, next) => {
    delegatesHandler.getLatestVotes(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/delegates/getLastBlock', (req, res, next) => {
    delegatesHandler.getLastBlock(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/delegates/getLastBlocks', (req, res, next) => {
    delegatesHandler.getLastBlocks(
      { publicKey: req.query.publicKey, limit: req.query.limit },
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/getSearch', (req, res, next) => {
    delegatesHandler.getSearch(
      req.query.q,
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/delegates/getNextForgers', (req, res, next) => {
    delegatesHandler.getNextForgers(
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
