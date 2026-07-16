import { epochToDate, round } from './format.js';
import { INITIAL_SUPPLY_BASE_UNITS } from '../../api/lib/adamant/constants.mjs';

/**
 * Delegate forging status logic, ported from the legacy `forgingStatus`
 * and `forgingMonitor` services.
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

const REQUIRED_HISTORY_ROUNDS = 5;
const NOT_FORGING_AFTER_MISSED_ROUNDS = 4;

/**
 * Derives the forging status of an active delegate.
 *
 * @param {Object} delegate Delegate with block, schedule, and history-coverage fields
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
    missedRounds: null,
  };

  if (delegate.blocksAt && delegate.blocks?.length > 0) {
    status.lastBlock = delegate.blocks[0];
    status.blockAt = epochToDate(status.lastBlock.timestamp);
    status.networkRound = round(networkHeight);
    status.delegateRound = round(status.lastBlock.height);
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
    // Do not turn missing startup/new-delegate history into a failure status
    status.code = 5;
    status.reason = 'insufficient-history';
  } else if (!status.lastBlock) {
    // Five observed rounds without a block prove at least four missed slots
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

    if (delegate.isRoundDelegate) {
      totals.awaitingSlot++;
    }
  }

  return totals;
}

/**
 * Calculate all block rewards minted after the initial 98 million ADM supply.
 * @param {string|number} supply Current network supply in base units
 * @returns {string} Lifetime block rewards in 1/10^8 ADM base units
 */
export function totalBlockRewards(supply) {
  try {
    const rewards = BigInt(supply ?? 0) - INITIAL_SUPPLY_BASE_UNITS;
    return (rewards > 0n ? rewards : 0n).toString();
  } catch {
    return '0';
  }
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
