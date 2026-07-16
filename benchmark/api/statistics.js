const statisticsHandler = require('../../api/lib/adamant/handlers/statistics');
const logger = require('../../utils/log');

module.exports = function () {
  this.getBlocks = (deferred) => {
    statisticsHandler.getBlocks(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark statistics.getBlocks: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark statistics.getBlocks: Completed; blocks=${data.volume.blocks}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getLastBlock = (deferred) => {
    statisticsHandler.getLastBlock(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark statistics.getLastBlock: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(`Benchmark statistics.getLastBlock: Completed; elapsed=${deferred.elapsed}s`);
      },
    );
  };

  this.getPeers = (deferred) => {
    statisticsHandler.getPeers(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark statistics.getPeers: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark statistics.getPeers: Completed; peers=${data.list.connected.length + data.list.disconnected.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };
};
