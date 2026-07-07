import { epochToDate, round } from './format.js';

/**
 * Delegate forging status logic, ported from the legacy `forgingStatus`
 * and `forgingMonitor` services.
 *
 * Status codes:
 *
 * - `0` forged a block in the current round
 * - `1` missed a block in the current round
 * - `2` not forging (missed the current and the previous round)
 * - `3` awaiting slot, forged in the previous round
 * - `4` awaiting slot, missed a block in the previous round
 * - `5` status unknown (not enough data yet)
 */

/**
 * Derives the forging status of an active delegate.
 *
 * @param {Object} delegate Delegate with `blocks`, `blocksAt`, and `isRoundDelegate` fields
 * @param {number} networkHeight Current network height used to determine the running round
 * @returns {{code: number, lastBlock: ?Object, blockAt: ?Date, awaitingSlot: ?number}}
 *   Status descriptor consumed by the status dot component
 */
export function forgingStatus(delegate, networkHeight) {
  const status = {
    updatedAt: delegate.blocksAt,
    lastBlock: null,
    blockAt: null,
    awaitingSlot: null,
  };

  if (delegate.blocksAt && delegate.blocks?.length > 0) {
    status.lastBlock = delegate.blocks[0];
    status.blockAt = epochToDate(status.lastBlock.timestamp);
    status.networkRound = round(networkHeight);
    status.delegateRound = round(status.lastBlock.height);
    status.awaitingSlot = status.networkRound - status.delegateRound;
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
    // Not forging
    status.code = 2;
  }

  return status;
}

/**
 * Aggregates forging status counts across active delegates.
 *
 * @param {Array<{forgingStatus: {code: number}}>} delegates Active delegates with computed statuses
 * @returns {{forging: number, missedBlock: number, notForging: number, awaitingSlot: number, unprocessed: number}}
 *   Totals per status bucket
 */
export function forgingTotals(delegates) {
  const totals = { forging: 0, missedBlock: 0, notForging: 0, awaitingSlot: 0, unprocessed: 0 };

  for (const delegate of delegates) {
    switch (delegate.forgingStatus.code) {
      case 0:
      case 3:
        totals.forging++;
        break;
      case 1:
      case 4:
        totals.missedBlock++;
        break;
      case 2:
        totals.notForging++;
        break;
      default:
        totals.unprocessed++;
    }

    if (delegate.forgingStatus.code === 3 || delegate.forgingStatus.code === 4) {
      totals.awaitingSlot++;
    }
  }

  return totals;
}

/**
 * Number of delegates with a resolved status this round, used by the
 * monitor's progress bar (out of the 101 active delegates).
 *
 * @param {{unprocessed: number}} totals Output of {@link forgingTotals}
 * @returns {number} Processed delegate count, at most 101
 */
export function forgingProgress(totals) {
  return totals.unprocessed > 0 ? 101 - totals.unprocessed : 101;
}
