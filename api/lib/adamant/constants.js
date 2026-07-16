/** Target interval between ADAMANT forging slots, in seconds. */
const BLOCK_INTERVAL_SECONDS = 5;

/** Target interval between ADAMANT forging slots, in milliseconds. */
const BLOCK_INTERVAL_MILLISECONDS = BLOCK_INTERVAL_SECONDS * 1000;

/** Number of active delegates and forging slots in one ADAMANT round. */
const ACTIVE_DELEGATES = 101;

/** Maximum number of blocks accepted by one Node `/api/blocks` request. */
const BLOCKS_PAGE_SIZE = 100;

/** Blocks loaded after startup, rollback, fork, or a detected cache gap. */
const BLOCK_CACHE_RECOVERY_BLOCKS = 300;

/** Length of the rolling Network Monitor statistics window. */
const BLOCK_STATISTICS_WINDOW_SECONDS = 24 * 60 * 60;

/** Maximum possible blocks in the rolling statistics window. */
const BLOCK_STATISTICS_WINDOW_BLOCKS = BLOCK_STATISTICS_WINDOW_SECONDS / BLOCK_INTERVAL_SECONDS;

module.exports = {
  ACTIVE_DELEGATES,
  BLOCK_CACHE_RECOVERY_BLOCKS,
  BLOCK_INTERVAL_MILLISECONDS,
  BLOCK_INTERVAL_SECONDS,
  BLOCKS_PAGE_SIZE,
  BLOCK_STATISTICS_WINDOW_BLOCKS,
  BLOCK_STATISTICS_WINDOW_SECONDS,
};
