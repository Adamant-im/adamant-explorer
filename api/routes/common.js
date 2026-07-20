const commonHandler = require('../lib/adamant/handlers/common');
const { allowQueryParameters } = require('./validation');

module.exports = function (app) {
  app.get('/api/search', allowQueryParameters('id'), (req, res, next) => {
    commonHandler.search(
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
};
