const blocksHandler = require('../lib/adamant/handlers/blocks');
const { allowQueryParameters } = require('./validation');

module.exports = function (app) {
  app.get('/api/getLastBlocks', allowQueryParameters('n'), (req, res, next) => {
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

  app.get('/api/getBlock', allowQueryParameters('blockId', 'height'), (req, res, next) => {
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

  app.get('/api/totalSupply', allowQueryParameters(), (req, res, next) => {
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
