const accountsHandler = require('../../api/lib/adamant/handlers/accounts');
const logger = require('../../utils/log');

module.exports = function () {
  this.getAccount = (deferred) => {
    accountsHandler.getAccount(
      { address: 'U9466395914658764774' },
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark accounts.getAccount: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(`Benchmark accounts.getAccount: Completed; elapsed=${deferred.elapsed}s`);
      },
    );
  };

  this.getTopAccounts = (deferred) => {
    accountsHandler.getTopAccounts(
      { offset: 0, limit: 50 },
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark accounts.getTopAccounts: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark accounts.getTopAccounts: Completed; accounts=${data.accounts.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };
};
