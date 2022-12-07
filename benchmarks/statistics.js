'use strict';

const logger = require('../utils/log');

module.exports = function (app, api) {
  const statistics = new api.statistics(app);

  this.getBlocks = (deferred) => {
    statistics.getBlocks(
      (data) => {
        deferred.resolve();
        logger.warn('statistics.getBlocks ~> ' + 'Error retrieving blocks: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('statistics.getBlocks ~> ' + String(data.volume.blocks) + ' blocks retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getLastBlock = (deferred) => {
    statistics.getLastBlock(
      (data) => {
        deferred.resolve();
        logger.warn('statistics.getLastBlock ~> ' + ' Error retrieving block: ' + data.error);
      },
       (data) => {
        deferred.resolve();
        logger.log('statistics.getLastBlock ~> ' + ' block retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getPeers = (deferred) => {
    statistics.locator.disabled = true;
    statistics.getPeers(
      (data) => {
        deferred.resolve();
        logger.warn('statistics.getPeers ~> ' + ' Error retrieving peers: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('statistics.getPeers ~> ' + (data.list.connected.length + data.list.disconnected.length) + ' peers retrieved in ' + String(deferred.elapsed), ' seconds');
      },
    );
  };
};
