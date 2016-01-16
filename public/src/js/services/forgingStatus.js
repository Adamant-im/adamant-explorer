'use strict';

angular.module('lisk_explorer.tools').service('forgingStatus',
  function (epochStampFilter) {
      return function (delegate) {
          var status = { updatedAt: delegate.blocksAt },
              statusAge = 0, blockAge = 0;

          if (delegate.blocksAt && _.size(delegate.blocks) > 0) {
              status.lastBlock = _.first(delegate.blocks);
              status.blockAt   = epochStampFilter(status.lastBlock.timestamp);

              statusAge = moment().diff(delegate.blocksAt, 'minutes');
              blockAge  = moment().diff(status.blockAt, 'minutes');
          } else {
              status.lastBlock = null;
          }

          if (!status.updatedAt) {
              // Unprocessed
              status.code = 5;
          } else if (!status.blockAt) {
              // Awaiting Status
              status.code = 4;
          } else if (statusAge > 9) {
              // Stale Status
              status.code = 3;
          } else if (blockAge <= 34) {
              // Forging
              status.code = 0;
          } else if (blockAge <= 68) {
              // Missed Cycles
              status.code = 1;
          } else {
              // Not Forging
              status.code = 2;
          }

          status.rating = status.code + (Math.pow(10, 3) + ~~delegate.rate).toString().substring(1);
          return status;
      };
  });
