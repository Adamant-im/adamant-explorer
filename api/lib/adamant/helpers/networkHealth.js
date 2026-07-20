const { ACTIVE_DELEGATES } = require('../constants.mjs');
const { classifyForgingStatus, forgingRound } = require('../../../../forgingStatus.mjs');

const NETWORK_LIVE_MINIMUM = 80;
const NETWORK_DEGRADED_MINIMUM = 51;
const NETWORK_HEALTH_MAX_ATTEMPTS = 3;

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
    delegates.some((publicKey) => typeof publicKey !== 'string' || !publicKey) ||
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

/**
 * Map an operational-delegate count to the monitoring status contract.
 * @param {number} forgingDelegates Operational active delegates
 * @returns {'live'|'degraded'|'critical'} Network status
 * @throws {TypeError} When the count is not between zero and 101
 */
function classifyNetworkHealth(forgingDelegates) {
  if (
    !Number.isSafeInteger(forgingDelegates) ||
    forgingDelegates < 0 ||
    forgingDelegates > ACTIVE_DELEGATES
  ) {
    throw new TypeError('Invalid operational delegate count');
  }

  if (forgingDelegates >= NETWORK_LIVE_MINIMUM) {
    return 'live';
  }

  if (forgingDelegates >= NETWORK_DEGRADED_MINIMUM) {
    return 'degraded';
  }

  return 'critical';
}

/**
 * Obtain a coherent request-time Node height and forging-health count.
 *
 * The routine uses the same schedule mapping, unresolved-round logic, recent
 * block merge, and Delegate Monitor status classifier as the Explorer header.
 * A height race is retried with fresh Node responses instead of combining
 * fields from different chain tips.
 *
 * Dependencies are injectable so every health state can be tested without a
 * live Explorer or ADAMANT node.
 * @param {Object} [dependencies] Snapshot dependencies
 * @param {Function} [dependencies.ensureBlocks] Ensure the shared block window is ready
 * @param {Function} [dependencies.getBlockStatus] Get normalized Node status
 * @param {Function} [dependencies.getCachedBlocks] Get the shared recent block window
 * @param {Function} [dependencies.getLatestBlocks] Get a focused recent block page
 * @param {Function} [dependencies.getNextForgersState] Get the 101-delegate schedule state
 * @param {Function} [dependencies.getForgingSchedule] Map Node state to absolute slots
 * @param {Function} [dependencies.getRoundDelegates] Get unresolved current-round delegates
 * @returns {Promise<{height: number, forgingDelegates: number, activeDelegates: number}>} Coherent snapshot
 * @throws {Error} When no coherent snapshot can be obtained in three attempts
 */
async function getNetworkHealthSnapshot(dependencies = {}) {
  const ensureBlocks =
    dependencies.ensureBlocks ?? (() => require('../handlers/statistics').ensureBlockStatistics());
  const getBlockStatus =
    dependencies.getBlockStatus ?? (() => require('../requests/blocks').getBlockStatus());
  const getCachedBlocks =
    dependencies.getCachedBlocks ?? (() => require('../handlers/statistics').getCachedBlocks());
  const getLatestBlocks =
    dependencies.getLatestBlocks ?? (() => require('../requests/blocks').getBlocks(0, 2));
  const getNextForgersState =
    dependencies.getNextForgersState ??
    (() => require('../requests/delegates').getNextForgersState());
  const getForgingSchedule =
    dependencies.getForgingSchedule ??
    ((state) => require('../../../../sockets/delegateMonitorSchedule').getForgingSchedule(state));
  const getRoundDelegates =
    dependencies.getRoundDelegates ??
    ((schedule, blocks) =>
      require('../../../../sockets/delegateMonitorSchedule').getRoundDelegates(schedule, blocks));

  await ensureBlocks();

  for (let attempt = 0; attempt < NETWORK_HEALTH_MAX_ATTEMPTS; attempt++) {
    const [status, state] = await Promise.all([getBlockStatus(), getNextForgersState()]);
    const height = Number(state?.currentBlock);
    const statusHeight = Number(status?.height);

    if (
      !Number.isSafeInteger(height) ||
      height < 1 ||
      !Number.isSafeInteger(statusHeight) ||
      statusHeight !== height
    ) {
      continue;
    }

    let recentBlocks = mergeForgingHealthBlocks(getCachedBlocks(), [], height);

    if (Number(recentBlocks[0]?.height) !== height) {
      recentBlocks = mergeForgingHealthBlocks(getCachedBlocks(), await getLatestBlocks(), height);
    }

    if (Number(recentBlocks[0]?.height) !== height) {
      continue;
    }

    const schedule = getForgingSchedule(state);
    const roundDelegates = getRoundDelegates(schedule, recentBlocks);
    const forgingDelegates = countActiveForgingDelegates(
      schedule.orderedDelegates,
      recentBlocks,
      height,
      roundDelegates,
    );

    if (forgingDelegates !== null) {
      return {
        height,
        forgingDelegates,
        activeDelegates: ACTIVE_DELEGATES,
      };
    }
  }

  throw new Error(
    `Could not obtain coherent network health after ${NETWORK_HEALTH_MAX_ATTEMPTS} attempts`,
  );
}

module.exports = {
  classifyNetworkHealth,
  countActiveForgingDelegates,
  getNetworkHealthSnapshot,
  mergeForgingHealthBlocks,
};
