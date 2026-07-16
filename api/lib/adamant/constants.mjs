/** Target interval between ADAMANT forging slots, in seconds. */
export const BLOCK_INTERVAL_SECONDS = 5;

/** Target interval between ADAMANT forging slots, in milliseconds. */
export const BLOCK_INTERVAL_MILLISECONDS = BLOCK_INTERVAL_SECONDS * 1000;

/** Number of active delegates and forging slots in one ADAMANT round. */
export const ACTIVE_DELEGATES = 101;

/** Initial ADM supply before block rewards, in 1/10^8 ADM base units. */
export const INITIAL_SUPPLY_BASE_UNITS = 9800000000000000n;

/** Maximum number of blocks accepted by one Node `/api/blocks` request. */
export const BLOCKS_PAGE_SIZE = 100;

/** Blocks loaded after startup, rollback, fork, or a detected cache gap. */
export const BLOCK_CACHE_RECOVERY_BLOCKS = 300;

/** Length of the rolling Network Monitor statistics window. */
export const BLOCK_STATISTICS_WINDOW_SECONDS = 24 * 60 * 60;

/** Maximum possible blocks in the rolling statistics window. */
export const BLOCK_STATISTICS_WINDOW_BLOCKS =
  BLOCK_STATISTICS_WINDOW_SECONDS / BLOCK_INTERVAL_SECONDS;
