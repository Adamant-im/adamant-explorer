const statisticsHandler = require('../../api/lib/adamant/handlers/statistics');
const logger = require('../../utils/log');

module.exports = function () {
  this.getBlocks = (deferred) => {
    statisticsHandler.getBlocks(
      (data) => {
        deferred.resolve();
        logger.warn('statisticsHandler.getBlocks ~> ' + 'Error retrieving blocks: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('statisticsHandler.getBlocks ~> ' + String(data.volume.blocks) + ' blocks retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLastBlock = (deferred) => {
    statisticsHandler.getLastBlock(
      (data) => {
        deferred.resolve();
        logger.warn('statisticsHandler.getLastBlock ~> ' + ' Error retrieving block: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('statisticsHandler.getLastBlock ~> ' + ' block retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getPeers = (deferred) => {
    statisticsHandler.getPeers(
      (data) => {
        deferred.resolve();
        logger.warn('statisticsHandler.getPeers ~> ' + ' Error retrieving peers: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('statisticsHandler.getPeers ~> ' + (data.list.connected.length + data.list.disconnected.length) + ' peers retrieved in ' + String(deferred.elapsed), ' seconds');
      },
    );
  };
};
