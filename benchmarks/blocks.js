'use strict';

const blocksHandler = require('../api/lib/adamant/handlers/blocks');
const logger = require('../utils/log');

module.exports = function () {
  this.getLastBlocks = (deferred) => {
    blocksHandler.getLastBlocks(
      1,
      (data) => {
        deferred.resolve();
        logger.warn('blocksHandler.getLastBlocks ~> ' + ' Error retrieving blocks: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('blocksHandler.getLastBlocks ~> ' + data.blocks.length + ' blocks retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getBlock = (deferred) => {
    blocksHandler.getBlock(
      {blockId: '10491613424735062732'},
      (data) => {
        deferred.resolve();
        logger.warn('blocksHandler.getBlock ~> ' + ' Error retrieving block: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('blocksHandler.getBlock ~> ' + ' block retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };

  this.getBlockStatus = (deferred) => {
    blocksHandler.getBlockStatus(
      (data) => {
        deferred.resolve();
        logger.warn('blocksHandler.getBlockStatus ~> ' + ' Error retrieving status: ' + data.error);
      },
      (data) => {
        deferred.resolve();
        logger.log('blocksHandler.getBlockStatus ~> ' + 'status retrieved in ' + String(deferred.elapsed) + ' seconds');
      },
    );
  };
};
