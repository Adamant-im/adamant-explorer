const crypto = require('crypto');
const { ACTIVE_DELEGATES, BLOCK_INTERVAL_SECONDS } = require('../api/lib/adamant/constants');

/**
 * Get the forging round containing a block height.
 * @param {number} height Block height
 * @returns {number} One-based forging round, or zero for height zero
 */
function getRound(height) {
  return Math.floor(height / ACTIVE_DELEGATES) + (height % ACTIVE_DELEGATES > 0 ? 1 : 0);
}

/**
 * Reproduce the ADAMANT Node v0.10.2 delegate shuffle for one block round.
 *
 * The Explorer needs this narrow client-side projection because the Node
 * `getNextForgers` endpoint shuffles by the last block height. At a round
 * boundary, the next block already uses the following round's shuffle.
 * @param {Array<string>} delegatePublicKeys Active public keys ordered by rank
 * @param {number} height Height of the block that will use the generated list
 * @returns {Array<string>} Shuffled delegate public keys
 */
function generateDelegateList(delegatePublicKeys, height) {
  const delegates = delegatePublicKeys.slice();
  let seed = crypto
    .createHash('sha256')
    .update(String(getRound(height)), 'utf8')
    .digest();

  // Keep the Node's outer-loop increment: it is part of the consensus shuffle.
  for (let index = 0; index < delegates.length; index++) {
    for (let seedIndex = 0; seedIndex < 4 && index < delegates.length; index++, seedIndex++) {
      const newIndex = seed[seedIndex] % delegates.length;
      [delegates[newIndex], delegates[index]] = [delegates[index], delegates[newIndex]];
    }

    seed = crypto.createHash('sha256').update(seed).digest();
  }

  return delegates;
}

/**
 * Build the schedule for the next block from an atomic Node timing snapshot.
 * @param {Array<string>} activePublicKeys Active public keys ordered by rank
 * @param {Object} state Node `getNextForgers` timing fields
 * @returns {Object} Timing fields plus projected next and current forgers
 */
function getForgingSchedule(activePublicKeys, state) {
  const orderedDelegates = generateDelegateList(activePublicKeys, state.currentBlock + 1);

  return moveForgingScheduleToSlot(
    {
      ...state,
      orderedDelegates,
    },
    state.currentSlot,
  );
}

/**
 * Advance a projected schedule to a known slot without waiting for REST.
 * The following REST refresh remains the authoritative confirmation.
 * @param {Object} schedule Schedule containing `orderedDelegates`
 * @param {number} currentSlot Slot to project
 * @returns {Object} Schedule projected to the requested slot
 */
function moveForgingScheduleToSlot(schedule, currentSlot) {
  const currentIndex = currentSlot % ACTIVE_DELEGATES;
  const nextDelegates = Array.from(
    { length: ACTIVE_DELEGATES },
    (_, index) => schedule.orderedDelegates[(currentIndex + index + 1) % ACTIVE_DELEGATES],
  );

  return {
    ...schedule,
    currentSlot,
    delegates: nextDelegates,
    currentForger: schedule.orderedDelegates[currentIndex],
  };
}

/**
 * Get delegates that still have a current-round slot, including the delegate
 * whose slot is in progress until either its block arrives or the slot ends.
 * @param {Object} schedule Output of {@link getForgingSchedule}
 * @param {Array<Object>} recentBlocks Contiguous blocks containing the current round start
 * @returns {Array<string>} Public keys with unresolved current-round slots
 */
function getRoundDelegates(schedule, recentBlocks = []) {
  if (!schedule?.orderedDelegates?.length || !recentBlocks.length) {
    return [];
  }

  const slotPending = schedule.currentSlot > schedule.currentBlockSlot;
  const latestBlock = recentBlocks[0];

  // A completed block round has no unresolved delegates until the next slot
  // starts. That slot provisionally opens the following 101-slot round.
  if (latestBlock.height % ACTIVE_DELEGATES === 0) {
    if (!slotPending) {
      return [];
    }

    return Array.from(
      { length: ACTIVE_DELEGATES },
      (_, index) => schedule.orderedDelegates[(schedule.currentSlot + index) % ACTIVE_DELEGATES],
    );
  }

  const roundStartHeight = (getRound(latestBlock.height) - 1) * ACTIVE_DELEGATES + 1;
  const roundStartBlock = recentBlocks.find((block) => block.height === roundStartHeight);

  if (!roundStartBlock) {
    return [];
  }

  const roundStartSlot = Math.floor(roundStartBlock.timestamp / BLOCK_INTERVAL_SECONDS);
  const roundEndSlot = roundStartSlot + ACTIVE_DELEGATES - 1;
  const firstUnresolvedSlot = Math.max(
    roundStartSlot,
    slotPending ? schedule.currentSlot : schedule.currentSlot + 1,
  );

  if (firstUnresolvedSlot > roundEndSlot) {
    return [];
  }

  return Array.from(
    { length: roundEndSlot - firstUnresolvedSlot + 1 },
    (_, index) => schedule.orderedDelegates[(firstUnresolvedSlot + index) % ACTIVE_DELEGATES],
  );
}

module.exports = {
  generateDelegateList,
  getForgingSchedule,
  getRound,
  getRoundDelegates,
  moveForgingScheduleToSlot,
};
