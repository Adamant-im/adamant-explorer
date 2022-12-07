'use strict';

const logger = require('../utils/log');

module.exports = function (app, api) {
  const accounts = new api.accounts(app);

  this.getAccount = (deferred) => {
    accounts.getAccount(
      {address: 'U9466395914658764774'},
      (data) => {
        deferred.resolve();
        logger.warn('accounts.getAccount ~> ' + 'Error retrieving account: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('accounts.getAccount ~> ' + 'account retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getTopAccounts = (deferred) => {
    accounts.getTopAccounts(
      {offset: 0, limit: 50},
      (data) => {
        deferred.resolve();
        logger.warn('accounts.getTopAccounts ~> ' + 'Error retrieving accounts: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('accounts.getTopAccounts ~> ' + data.accounts.length + ' accounts retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
