const commonHandler = require('../../api/lib/adamant/handlers/common');
const logger = require('../../utils/log');

module.exports = function (app) {
  this.getPriceTicker = function (deferred) {
    commonHandler.getPriceTicker(
      app.get('exchange enabled'),
      app.exchange,
      (data) => {
        deferred.resolve();
        logger.warn('commonHandler.getPriceTicker ~> ' + ' Error retrieving price ticker: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('commonHandler.getPriceTicker ~> ' + 'price ticker retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.search = (deferred) => {
    commonHandler.search(
      '10491613424735062732',
       (data) => {
        deferred.resolve();
        logger.warn('commonHandler.search ~> ' + ' Error retrieving search result: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('commonHandler.search ~> ' + ' search result retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
