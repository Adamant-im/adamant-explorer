const blocksHandler = require('../../api/lib/adamant/handlers/blocks');
const logger = require('../../utils/log');

module.exports = function () {
  this.getLastBlocks = (deferred) => {
    blocksHandler.getLastBlocks(
      1,
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark blocks.getLastBlocks: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(
          `Benchmark blocks.getLastBlocks: Completed; blocks=${data.blocks.length}; elapsed=${deferred.elapsed}s`,
        );
      },
    );
  };

  this.getBlock = (deferred) => {
    blocksHandler.getBlock(
      { blockId: '10491613424735062732' },
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark blocks.getBlock: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(`Benchmark blocks.getBlock: Completed; elapsed=${deferred.elapsed}s`);
      },
    );
  };

  this.getBlockStatus = (deferred) => {
    blocksHandler.getBlockStatus(
      (data) => {
        deferred.resolve();
        logger.warn(`Benchmark blocks.getBlockStatus: Failed: ${data.error}`);
      },
      (data) => {
        deferred.resolve();
        logger.log(`Benchmark blocks.getBlockStatus: Completed; elapsed=${deferred.elapsed}s`);
      },
    );
  };
};
