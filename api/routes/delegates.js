const delegatesHandler = require('../lib/adamant/handlers/delegates');
const { allowQueryParameters } = require('./validation');

module.exports = function (app) {
  app.get('/api/delegates/getStandby', allowQueryParameters('n'), (req, res, next) => {
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
};
