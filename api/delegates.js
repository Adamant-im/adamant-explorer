'use strict';

const delegates = require('../lib/api/delegates');

module.exports = function (app) {
  const api = new delegates(app);

  app.get('/api/delegates/getActive', (req, res, next) => {
    api.getActive(
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
    api.getStandby(
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
    api.getLatestRegistrations(
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
    api.getLatestVotes(
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
    api.getLastBlock(
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
    api.getLastBlocks(
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
    api.getSearch(
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
    api.getNextForgers(
      (data) => {
        res.json(data);
      },
      (data) => {
        req.json = data;
        return next();
      },
    );
  });

  app.get('/api/delegates/getDelegateProposals', (req, res, next) => {
    api.getDelegateProposals(
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
