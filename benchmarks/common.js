'use strict';

const logger = require('../utils/log');

module.exports = function (app, api) {
  const common = new api.common(app, api);

  this.getPriceTicker = function (deferred) {
    common.getPriceTicker(
      (data) => {
        deferred.resolve();
        logger.warn('common.getPriceTicker ~> ' + ' Error retrieving price ticker: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('common.getPriceTicker ~> ' + 'price ticker retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.search = (deferred) => {
    common.search(
      '10491613424735062732',
       (data) => {
        deferred.resolve();
        logger.warn('common.search ~> ' + ' Error retrieving search result: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('common.search ~> ' + ' search result retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
