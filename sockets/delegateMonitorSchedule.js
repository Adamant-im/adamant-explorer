const {
  ACTIVE_DELEGATES,
  BLOCK_INTERVAL_MILLISECONDS,
  BLOCK_INTERVAL_SECONDS,
} = require('../api/lib/adamant/constants.mjs');

/**
 * Calculate the delay to the next absolute network slot boundary.
 * @param {number} nowMilliseconds Current Unix timestamp in milliseconds
 * @param {number} graceMilliseconds Delay after the boundary before firing
 * @returns {number} Milliseconds until the refresh should run
 */
function getNextSlotRefreshDelay(nowMilliseconds, graceMilliseconds) {
  const elapsedInSlot = nowMilliseconds % BLOCK_INTERVAL_MILLISECONDS;

  return Math.max(
    graceMilliseconds,
    BLOCK_INTERVAL_MILLISECONDS - elapsedInSlot + graceMilliseconds,
  );
}

/**
 * Get the forging round containing a block height.
 * @param {number} height Block height
 * @returns {number} One-based forging round, or zero for height zero
 */
function getRound(height) {
  return Math.floor(height / ACTIVE_DELEGATES) + (height % ACTIVE_DELEGATES > 0 ? 1 : 0);
}

/**
 * Build an absolute-slot schedule from the Node's next-block snapshot.
 * @param {Object} state Node `getNextForgers` response with all 101 delegates
 * @returns {Object} Timing fields plus projected next and current forgers
 */
function getForgingSchedule(state) {
  const orderedDelegates = Array(ACTIVE_DELEGATES);

  state.delegates.forEach((publicKey, index) => {
    orderedDelegates[(state.currentSlot + index + 1) % ACTIVE_DELEGATES] = publicKey;
  });

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

    const missedSlots = Math.max(0, schedule.currentSlot - schedule.currentBlockSlot - 1);
    const remainingSlots = Math.max(0, ACTIVE_DELEGATES - missedSlots);

    return Array.from(
      { length: remainingSlots },
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
  getForgingSchedule,
  getNextSlotRefreshDelay,
  getRound,
  getRoundDelegates,
  moveForgingScheduleToSlot,
};
