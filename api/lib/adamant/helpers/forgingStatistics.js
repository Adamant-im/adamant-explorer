const { ACTIVE_DELEGATES, INITIAL_SUPPLY_BASE_UNITS } = require('../constants');

/** Convert a Node integer field to an exact base-unit value. */
function integer(value, label) {
  try {
    return BigInt(value ?? 0);
  } catch {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

/** Sum lifetime `rewards + fees` credited to every registered delegate. */
function sumDelegateForged(delegates) {
  return (delegates ?? []).reduce(
    (total, delegate) => total + integer(delegate.forged, 'delegate forged amount'),
    0n,
  );
}

/** Last height whose round-level rewards and fees have been credited to accounts. */
function getCreditedHeight(height) {
  return height - (height % ACTIVE_DELEGATES);
}

/**
 * Select a complete contiguous block interval from a descending recent-block cache.
 * @param {Array<Object>} blocks Recent blocks
 * @param {number} startHeight Inclusive interval start
 * @param {number} endHeight Inclusive interval end
 * @returns {Array<Object>} Requested blocks
 */
function selectBlockInterval(blocks, startHeight, endHeight) {
  if (startHeight > endHeight) {
    return [];
  }

  const byHeight = new Map(
    (blocks ?? [])
      .filter((block) => block.height >= startHeight && block.height <= endHeight)
      .map((block) => [block.height, block]),
  );
  const interval = [];

  for (let height = startHeight; height <= endHeight; height++) {
    const block = byHeight.get(height);

    if (!block) {
      throw new Error(`Block cache is missing height ${height}`);
    }

    interval.push(block);
  }

  return interval;
}

/**
 * Establish cumulative transaction fees at the last completed round.
 *
 * Delegate account totals are credited at round end. Rewards and fees from the
 * in-progress round are therefore removed before establishing this baseline.
 * @param {Array<Object>} delegates All registered delegates
 * @param {Object} status Node block status containing `height` and `supply`
 * @param {Array<Object>} blocks Recent blocks containing the current round
 * @returns {{creditedHeight: number, transactionFees: string}}
 */
function createForgingBaseline(delegates, status, blocks) {
  const height = Number(status.height);

  if (!Number.isSafeInteger(height) || height < 0) {
    throw new Error(`Invalid blockchain height: ${status.height}`);
  }

  const creditedHeight = getCreditedHeight(height);
  const uncreditedBlocks = selectBlockInterval(blocks, creditedHeight + 1, height);
  const totalRewards = integer(status.supply, 'network supply') - INITIAL_SUPPLY_BASE_UNITS;
  const uncreditedRewards = uncreditedBlocks.reduce(
    (total, block) => total + integer(block.reward, 'block reward'),
    0n,
  );
  const transactionFees = sumDelegateForged(delegates) - (totalRewards - uncreditedRewards);

  if (transactionFees < 0n) {
    throw new Error('Calculated transaction fees cannot be negative');
  }

  return {
    creditedHeight,
    transactionFees: transactionFees.toString(),
  };
}

/**
 * Add fees from blocks forged after a completed-round baseline.
 * @param {{creditedHeight: number, transactionFees: string}} baseline Baseline
 * @param {Array<Object>} blocks Recent blocks containing every newer height
 * @param {number} height Current chain height
 * @returns {string} Lifetime transaction fees in base units
 */
function projectTransactionFees(baseline, blocks, height) {
  if (!baseline) {
    return '0';
  }

  if (height < baseline.creditedHeight) {
    throw new Error('Blockchain height predates the transaction-fee baseline');
  }

  const newerBlocks = selectBlockInterval(blocks, baseline.creditedHeight + 1, height);

  return newerBlocks
    .reduce(
      (total, block) => total + integer(block.totalFee, 'block transaction fee'),
      integer(baseline.transactionFees, 'transaction-fee baseline'),
    )
    .toString();
}

module.exports = {
  createForgingBaseline,
  getCreditedHeight,
  projectTransactionFees,
  sumDelegateForged,
};
