import AppServices from './services.module';

AppServices.service('forgingStatus', ($rootScope, epochStampFilter, roundFilter) => (delegate) => {
  const status = { updatedAt: delegate.blocksAt };

  if (delegate.blocksAt && delegate.blocks.length > 0) {
    status.lastBlock = delegate.blocks[0];
    status.blockAt = epochStampFilter(status.lastBlock.timestamp);
    status.networkRound = roundFilter($rootScope.blockStatus.height);
    status.delegateRound = roundFilter(status.lastBlock.height);
    status.awaitingSlot = status.networkRound - status.delegateRound;
  } else {
    status.lastBlock = null;
  }

  if (status.awaitingSlot === 0) {
    // Forged block in current round
    status.code = 0;
  } else if (!delegate.isRoundDelegate && status.awaitingSlot === 1) {
    // Missed block in current round
    status.code = 1;
  } else if (!delegate.isRoundDelegate && status.awaitingSlot > 1) {
    // Missed block in current and last round = not forging
    status.code = 2;
  } else if (status.awaitingSlot === 1) {
    // Awaiting slot, but forged in last round
    status.code = 3;
  } else if (status.awaitingSlot === 2) {
    // Awaiting slot, but missed block in last round
    status.code = 4;
  } else if (!status.blockAt || !status.updatedAt) {
    // Awaiting status or unprocessed.
    // Note: misreported statuses right after opening the Delegate Monitor
    // are a known problem, tracked in a separate issue
    status.code = 5;
  } else {
    // Not Forging
    status.code = 2;
  }

  delegate.status = [status.code, delegate.rate].join(':');
  return status;
});
