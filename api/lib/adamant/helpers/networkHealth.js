const { ACTIVE_DELEGATES } = require('../constants.mjs');
const { classifyForgingStatus, forgingRound } = require('../../../../forgingStatus.mjs');

/**
 * Builds one descending, height-unique block list for a schedule height.
 *
 * Focused REST blocks take precedence over the process cache so a header
 * refresh can bridge the short race where the schedule has advanced before
 * the WebSocket block reaches the shared accumulator.
 *
 * @param {Array<Object>} cachedBlocks Process-wide rolling block history
 * @param {Array<Object>} freshBlocks Focused latest-block REST response
 * @param {number} networkHeight Height reported with the forging schedule
 * @returns {Array<Object>} Blocks at or below the schedule height
 */
function mergeForgingHealthBlocks(cachedBlocks, freshBlocks, networkHeight) {
  const height = Number(networkHeight);
  const blocksByHeight = new Map();

  for (const block of [...(freshBlocks ?? []), ...(cachedBlocks ?? [])]) {
    const blockHeight = Number(block?.height);

    if (
      Number.isSafeInteger(blockHeight) &&
      blockHeight > 0 &&
      blockHeight <= height &&
      !blocksByHeight.has(blockHeight)
    ) {
      blocksByHeight.set(blockHeight, block);
    }
  }

  return [...blocksByHeight.values()].sort((left, right) => right.height - left.height);
}

/**
 * Counts scheduled delegates whose Delegate Monitor status is not
 * `Not forging` or unknown. Recent misses stay operational until the shared
 * status classifier marks four completed slots as missed.
 *
 * @param {Array<string>} delegatePublicKeys Current 101-delegate forging schedule
 * @param {Array<Object>} blocks Recent blocks in descending height order
 * @param {number} networkHeight Height matching the forging schedule
 * @param {Array<string>} roundDelegatePublicKeys Delegates with an unresolved current-round slot
 * @returns {number|null} Operational forging delegates, or `null` without a complete schedule
 */
function countActiveForgingDelegates(
  delegatePublicKeys,
  blocks,
  networkHeight,
  roundDelegatePublicKeys,
) {
  const delegates = Array.isArray(delegatePublicKeys) ? [...new Set(delegatePublicKeys)] : [];
  const recentBlocks = Array.isArray(blocks) ? blocks : [];
  const height = Number(networkHeight);

  if (
    delegates.length !== ACTIVE_DELEGATES ||
    !Number.isSafeInteger(height) ||
    height < 1 ||
    !recentBlocks.length
  ) {
    return null;
  }

  const latestByGenerator = new Map();

  for (const block of recentBlocks) {
    if (block.generatorPublicKey && !latestByGenerator.has(block.generatorPublicKey)) {
      latestByGenerator.set(block.generatorPublicKey, block);
    }
  }

  const oldestRound = forgingRound(recentBlocks[recentBlocks.length - 1].height);
  const historyRoundCount = Math.max(0, forgingRound(height) - oldestRound + 1);
  const roundDelegates = new Set(roundDelegatePublicKeys);

  return delegates.reduce((total, publicKey) => {
    const lastBlock = latestByGenerator.get(publicKey);
    const delegate = {
      blocksAt: true,
      blocks: lastBlock ? [lastBlock] : [],
      historyRoundCount,
      isRoundDelegate: roundDelegates.has(publicKey),
    };
    const status = classifyForgingStatus(delegate, height);

    return total + (status.code !== 2 && status.code !== 5 ? 1 : 0);
  }, 0);
}

module.exports = {
  countActiveForgingDelegates,
  mergeForgingHealthBlocks,
};
