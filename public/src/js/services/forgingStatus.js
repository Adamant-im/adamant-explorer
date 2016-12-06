'use strict';

angular.module('lisk_explorer.tools').service('forgingStatus',
  function ($rootScope, epochStampFilter, roundFilter) {
      return function (delegate, forceNotForging) {
          var status = { updatedAt: delegate.blocksAt },
              statusAge = 0, blockAge = 0;

          if (delegate.blocksAt && _.size(delegate.blocks) > 0) {
              status.lastBlock = _.first(delegate.blocks);
              status.blockAt   = epochStampFilter(status.lastBlock.timestamp);
              status.networkRound = roundFilter($rootScope.blockStatus.height);
              status.delegateRound = roundFilter(status.lastBlock.height);
              status.awaitingSlot = status.networkRound - status.delegateRound;

              statusAge = moment().diff(delegate.blocksAt, 'minutes');
              blockAge  = moment().diff(status.blockAt, 'minutes');
          } else {
              status.lastBlock = null;
          }

          if (forceNotForging && status.awaitingSlot > 1) {
              // Missed block in current and last round = not forging
              status.code = 2;
          } else if (forceNotForging && status.awaitingSlot === 1) {
              // Missed block in current round
              status.code = 1;
          } else if (!status.blockAt || !status.updatedAt) {
              // Awaiting status or unprocessed
              status.code = 5;
          } else if (status.awaitingSlot === 0) {
              // Forged block in current round
              status.code = 0;
          } else if (status.awaitingSlot === 1) {
              // Awaiting slot, but forged in last round
              status.code = 3;
          } else if (status.awaitingSlot === 2) {
              // Awaiting slot, but missed block in last round
              status.code = 4;
          } else {
              // Not Forging
              status.code = 2;
          }

          delegate.status = [status.code, delegate.rate].join(':');
          return status;
      };
  });
