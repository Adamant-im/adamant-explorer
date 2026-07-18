import { epochToDate } from './format.js';
import { INITIAL_SUPPLY_BASE_UNITS } from '../../api/lib/adamant/constants.mjs';
import { aggregateForgingStatuses, classifyForgingStatus } from '../../forgingStatus.mjs';

/**
 * Derives the forging status of an active delegate.
 *
 * @param {Object} delegate Delegate with block, schedule, and history-coverage fields
 * @param {number} networkHeight Current network height used to determine the running round
 * @returns {{code: number, lastBlock: ?Object, blockAt: ?Date, awaitingSlot: ?number}}
 *   Status descriptor consumed by the status dot component
 */
export function forgingStatus(delegate, networkHeight) {
  const status = classifyForgingStatus(delegate, networkHeight);

  return {
    ...status,
    blockAt: status.lastBlock ? epochToDate(status.lastBlock.timestamp) : null,
  };
}

/**
 * Aggregates forging status counts across active delegates.
 *
 * @param {Array<{forgingStatus: {code: number}, isRoundDelegate: boolean}>} delegates Active delegates with computed statuses
 * @returns {{forging: number, missedBlock: number, notForging: number, awaitingSlot: number, unprocessed: number}}
 *   Totals per status bucket
 */
export function forgingTotals(delegates) {
  return aggregateForgingStatuses(delegates);
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
