'use strict';

const logger = require('../utils/log');

module.exports = function (app, api) {
  const delegates = new api.delegates(app);

  this.getActive = (deferred) => {
    delegates.getActive(
      (data) => {
        deferred.resolve();
        logger.warn('delegates.getActive ~> ' + 'Error retrieving delegates: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegates.getActive ~> ' + data.delegates.length + ' delegates retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getStandby = (deferred) => {
    delegates.getStandby(
      0,
      (data) => {
        deferred.resolve();
        logger.warn('delegates.getStandby ~> ' + ' Error retrieving delegates: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegates.getStandby ~> ' + data.delegates.length + ' delegates retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLatestRegistrations = (deferred) => {
    delegates.getLatestRegistrations(
      (data) => {
        deferred.resolve();
        logger.warn('delegates.getLatestRegistrations ~> ' + ' Error retrieving registrations: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegates.getLatestRegistrations ~> ' + data.transactions.length + ' registrations retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLatestVotes = (deferred) => {
    delegates.getLatestVotes(
      (data) => {
        deferred.resolve();
        logger.warn('delegates.getLatestVotes ~> ' + ' Error retrieving votes: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegates.getLatestVotes ~> ' + data.transactions.length + ' votes retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLastBlock = (deferred) => {
    delegates.getLastBlock(
      (data) => {
        deferred.resolve();
        logger.warn('delegates.getLastBlock ~> ' + ' Error retrieving block: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('delegates.getLastBlock ~> ' + ' block retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
