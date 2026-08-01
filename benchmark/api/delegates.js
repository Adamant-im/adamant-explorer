const delegatesHandler = require('../../api/lib/adamant/handlers/delegates');
const logger = require('../../utils/log');

module.exports = function () {
  this.getActive = (deferred) => {
    delegatesHandler.getActive(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark delegates.getActive: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark delegates.getActive: Completed; delegates=${data.delegates.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getStandby = (deferred) => {
    delegatesHandler.getStandby(
      0,
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark delegates.getStandby: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark delegates.getStandby: Completed; delegates=${data.delegates.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getLatestRegistrations = (deferred) => {
    delegatesHandler.getLatestRegistrations(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark delegates.getLatestRegistrations: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark delegates.getLatestRegistrations: Completed; registrations=${data.transactions.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getLatestVotes = (deferred) => {
    delegatesHandler.getLatestVotes(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark delegates.getLatestVotes: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark delegates.getLatestVotes: Completed; votes=${data.transactions.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getLastBlock = (deferred) => {
    delegatesHandler.getLastBlock(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark delegates.getLastBlock: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(`Benchmark delegates.getLastBlock: Completed; elapsed=${deferred.elapsed}s`);
      },
    );
  };
};
