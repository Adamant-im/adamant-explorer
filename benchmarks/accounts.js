const accountsHandler = require('../api/lib/adamant/handlers/accounts');
const logger = require('../utils/log');

module.exports = function () {
  this.getAccount = (deferred) => {
    accountsHandler.getAccount(
      {address: 'U9466395914658764774'},
      (data) => {
        deferred.resolve();
        logger.warn('accountsHandler.getAccount ~> ' + 'Error retrieving account: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('accountsHandler.getAccount ~> ' + 'account retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getTopAccounts = (deferred) => {
    accountsHandler.getTopAccounts(
      {offset: 0, limit: 50},
      (data) => {
        deferred.resolve();
        logger.warn('accountsHandler.getTopAccounts ~> ' + 'Error retrieving accountsHandler: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('accounts.getTopAccounts ~> ' + data.accounts.length + ' accounts retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
