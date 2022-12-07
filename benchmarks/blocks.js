'use strict';

const logger = require('../utils/log');

module.exports = function (app, api) {
  const blocks = new api.blocks(app);

  this.getLastBlocks = (deferred) => {
    blocks.getLastBlocks(
      1,
      (data) => {
        deferred.resolve();
        logger.warn('blocks.getLastBlocks ~> ' + ' Error retrieving blocks: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('blocks.getLastBlocks ~> ' + data.blocks.length + ' blocks retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getBlock = (deferred) => {
    blocks.getBlock(
      '10491613424735062732',
      (data) => {
        deferred.resolve();
        logger.warn('blocks.getBlock ~> ' + ' Error retrieving block: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('blocks.getBlock ~> ' + ' block retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getBlockStatus = (deferred) => {
    blocks.getBlockStatus(
      (data) => {
        deferred.resolve();
        logger.warn('blocks.getBlockStatus ~> ' + ' Error retrieving status: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('blocks.getBlockStatus ~> ' + 'status retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
