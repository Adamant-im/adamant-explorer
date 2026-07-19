/**
 * Delegate forging status logic shared by the server-side network health
 * snapshot and the Delegate Monitor UI.
 *
 * Status codes:
 *
 * - `0` forged a block in the current round
 * - `1` missed one to three completed forging slots
 * - `2` not forging (missed four or more completed slots)
 * - `3` awaiting slot, forged in the previous round
 * - `4` awaiting slot after one to three missed slots
 * - `5` status unknown (not enough data yet)
 */

import { ACTIVE_DELEGATES } from './api/lib/adamant/constants.mjs';

const REQUIRED_HISTORY_ROUNDS = 5;
const NOT_FORGING_AFTER_MISSED_ROUNDS = 4;

/**
 * Returns the forging round containing a block height.
 * @param {number|string} height Block height
 * @returns {number} One-based round number, or zero for invalid input
 */
export function forgingRound(height) {
  const numericHeight = Number(height);

  if (!Number.isSafeInteger(numericHeight) || numericHeight < 1) {
    return 0;
  }

  return (
    Math.floor(numericHeight / ACTIVE_DELEGATES) + (numericHeight % ACTIVE_DELEGATES > 0 ? 1 : 0)
  );
}

/**
 * Derives the forging status of an active delegate.
 *
 * @param {Object} delegate Delegate with block, schedule, and history-coverage fields
 * @param {number} networkHeight Current network height
 * @returns {{code: number, updatedAt: *, lastBlock: ?Object, awaitingSlot: ?number, missedRounds: ?number, reason?: string}}
 *   Framework-independent status descriptor
 */
export function classifyForgingStatus(delegate, networkHeight) {
  const status = {
    updatedAt: delegate.blocksAt,
    lastBlock: null,
    awaitingSlot: null,
    missedRounds: null,
  };

  if (delegate.blocksAt && delegate.blocks?.length > 0) {
    status.lastBlock = delegate.blocks[0];
    status.networkRound = forgingRound(networkHeight);
    status.delegateRound = forgingRound(status.lastBlock.height);
    status.awaitingSlot = status.networkRound - status.delegateRound;
  }

  if (!status.updatedAt) {
    status.code = 5;
    status.reason = 'awaiting-data';
  } else if (status.awaitingSlot === 0) {
    status.code = 0;
  } else if (status.awaitingSlot === 1) {
    if (delegate.isRoundDelegate) {
      status.code = 3;
    } else if ((delegate.historyRoundCount ?? 0) < REQUIRED_HISTORY_ROUNDS) {
      status.code = 5;
      status.reason = 'insufficient-history';
    } else {
      status.missedRounds = 1;
      status.code = 1;
    }
  } else if ((delegate.historyRoundCount ?? 0) < REQUIRED_HISTORY_ROUNDS) {
    status.code = 5;
    status.reason = 'insufficient-history';
  } else if (!status.lastBlock) {
    status.missedRounds = NOT_FORGING_AFTER_MISSED_ROUNDS;
    status.code = 2;
  } else {
    status.missedRounds = Math.max(0, status.awaitingSlot - (delegate.isRoundDelegate ? 1 : 0));

    if (status.missedRounds >= NOT_FORGING_AFTER_MISSED_ROUNDS) {
      status.code = 2;
    } else {
      status.code = delegate.isRoundDelegate ? 4 : 1;
    }
  }

  return status;
}

/**
 * Aggregates forging status counts across active delegates.
 *
 * @param {Array<{forgingStatus: {code: number}, isRoundDelegate: boolean}>} delegates Active delegates with computed statuses
 * @returns {{forging: number, missedBlock: number, notForging: number, awaitingSlot: number, unprocessed: number}}
 *   Totals per status bucket
 */
export function aggregateForgingStatuses(delegates) {
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

    if (delegate.isRoundDelegate) {
      totals.awaitingSlot++;
    }
  }

  return totals;
}
