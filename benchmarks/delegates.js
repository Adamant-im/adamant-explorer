const delegatesHandler = require('../api/lib/adamant/handlers/delegates');
const logger = require('../utils/log');

module.exports = function () {
  this.getActive = (deferred) => {
    delegatesHandler.getActive(
      (data) => {
        deferred.resolve();
        logger.warn('delegatesHandler.getActive ~> ' + 'Error retrieving delegates: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegatesHandler.getActive ~> ' + data.delegates.length + ' delegates retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getStandby = (deferred) => {
    delegatesHandler.getStandby(
      0,
      (data) => {
        deferred.resolve();
        logger.warn('delegatesHandler.getStandby ~> ' + ' Error retrieving delegates: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegatesHandler.getStandby ~> ' + data.delegates.length + ' delegates retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLatestRegistrations = (deferred) => {
    delegatesHandler.getLatestRegistrations(
      (data) => {
        deferred.resolve();
        logger.warn('delegatesHandler.getLatestRegistrations ~> ' + ' Error retrieving registrations: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegatesHandler.getLatestRegistrations ~> ' + data.transactions.length + ' registrations retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLatestVotes = (deferred) => {
    delegatesHandler.getLatestVotes(
      (data) => {
        deferred.resolve();
        logger.warn('delegatesHandler.getLatestVotes ~> ' + ' Error retrieving votes: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegatesHandler.getLatestVotes ~> ' + data.transactions.length + ' votes retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLastBlock = (deferred) => {
    delegatesHandler.getLastBlock(
      (data) => {
        deferred.resolve();
        logger.warn('delegatesHandler.getLastBlock ~> ' + ' Error retrieving block: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegatesHandler.getLastBlock ~> ' + ' block retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
