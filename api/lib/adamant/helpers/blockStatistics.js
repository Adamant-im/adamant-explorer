const {
  BLOCK_INTERVAL_SECONDS,
  BLOCKS_PAGE_SIZE,
  BLOCK_STATISTICS_WINDOW_BLOCKS,
  BLOCK_STATISTICS_WINDOW_SECONDS,
} = require('../constants');

/** Aggregates volume and best-block statistics over a bounded recent window. */
class BlocksStatistics {
  /**
   * @param {number} [windowSize=100] Maximum blocks to aggregate
   */
  constructor(windowSize = BLOCKS_PAGE_SIZE) {
    this.windowSize = windowSize;
  }

  best = {
    block: null,
    amount: 0,
  };

  volume = {
    amount: 0,
    blocks: 0,
    txs: 0,
    withTxs: 0,
    beginning: null,
    end: null,
  };

  /**
   * Add recent blocks to the aggregate.
   * @param {Array} blocks Blocks in descending height order
   */
  inspect(blocks) {
    if (blocks.length <= 0) {
      return;
    }

    const window = blocks.slice(0, this.windowSize);

    for (const block of window) {
      // `totalAmount` is the sum of transaction values. Fees are paid to the
      // forger, but they are not value transferred by these transactions.
      const transferredAmount = Number(block.totalAmount) || 0;

      this.volume.blocks += 1;
      this.volume.txs += block.numberOfTransactions;
      this.volume.amount += transferredAmount;

      if (transferredAmount > 0) {
        this.volume.withTxs += 1;

        if (transferredAmount > this.best.amount) {
          this.best.block = block;
          this.best.amount = transferredAmount;
        }
      }
    }

    this.volume.beginning = window[window.length - 1].timestamp;
    this.volume.end = window[0].timestamp;
  }
}

/**
 * Rolling block window shared by REST, WebSocket, and Socket.IO consumers.
 *
 * It starts with a bounded recovery snapshot and merges later pages by height. A gap, a
 * rollback, or a fork resets the cache rather than presenting incomplete data
 * as a continuous 24-hour window.
 */
class RollingBlocksWindow {
  constructor() {
    this.byHeight = new Map();
  }

  /**
   * Merge a descending page of recent blocks into the rolling window.
   * @param {Array<Object>} blocks Recent blocks from the Node
   * @returns {{reset: boolean, rejected?: boolean, size: number}} Merge result
   */
  merge(blocks) {
    const incoming = [...blocks]
      .filter((block) => Number.isFinite(Number(block.height)))
      .sort((a, b) => Number(b.height) - Number(a.height));

    if (!incoming.length) {
      return { reset: false, size: this.byHeight.size };
    }

    const hasInternalGap = incoming.some((block, index) => {
      return index > 0 && Number(incoming[index - 1].height) - Number(block.height) !== 1;
    });

    if (hasInternalGap) {
      return { reset: true, rejected: true, size: this.byHeight.size };
    }

    const reset = !this.#canMerge(incoming);

    if (reset) {
      this.byHeight.clear();
    }

    for (const block of incoming) {
      this.byHeight.set(Number(block.height), block);
    }

    const sorted = this.blocks;
    const latestTimestamp = Number(sorted[0].timestamp);
    const cutoff = latestTimestamp - BLOCK_STATISTICS_WINDOW_SECONDS;
    const retained = sorted
      .filter((block) => Number(block.timestamp) >= cutoff)
      .slice(0, BLOCK_STATISTICS_WINDOW_BLOCKS);

    this.byHeight = new Map(retained.map((block) => [Number(block.height), block]));

    return { reset, size: this.byHeight.size };
  }

  /**
   * Replace the rolling window with a trusted contiguous recovery snapshot.
   * @param {Array<Object>} blocks Recent blocks from the Node or persistent cache
   * @returns {{reset: boolean, rejected?: boolean, size: number}} Replacement result
   */
  replace(blocks) {
    const previous = new Map(this.byHeight);
    this.byHeight.clear();
    const result = this.merge(blocks);

    if (result.rejected) {
      this.byHeight = previous;
    }

    return result;
  }

  /** Blocks in descending height order. */
  get blocks() {
    return [...this.byHeight.values()].sort((a, b) => Number(b.height) - Number(a.height));
  }

  /** Coverage information included in the public statistics payload. */
  get coverage() {
    const blocks = this.blocks;

    if (!blocks.length) {
      return {
        complete: false,
        coverageSeconds: 0,
        targetBlocks: BLOCK_STATISTICS_WINDOW_BLOCKS,
        windowSeconds: BLOCK_STATISTICS_WINDOW_SECONDS,
      };
    }

    const coverageSeconds =
      Number(blocks[0].timestamp) -
      Number(blocks[blocks.length - 1].timestamp) +
      BLOCK_INTERVAL_SECONDS;

    return {
      complete: coverageSeconds >= BLOCK_STATISTICS_WINDOW_SECONDS,
      coverageSeconds: Math.min(coverageSeconds, BLOCK_STATISTICS_WINDOW_SECONDS),
      targetBlocks: BLOCK_STATISTICS_WINDOW_BLOCKS,
      windowSeconds: BLOCK_STATISTICS_WINDOW_SECONDS,
    };
  }

  /**
   * Determine whether an incoming page overlaps or directly follows the cache.
   * @param {Array<Object>} incoming Descending recent block page
   * @returns {boolean} Whether the page can be merged without leaving a gap
   */
  #canMerge(incoming) {
    const cached = this.blocks;

    if (!cached.length) {
      return true;
    }

    const cachedLatestHeight = Number(cached[0].height);
    const incomingLatestHeight = Number(incoming[0].height);
    const incomingOldestHeight = Number(incoming[incoming.length - 1].height);

    if (incomingOldestHeight > cachedLatestHeight + 1) {
      return false;
    }

    // A REST response from a slightly lagging healthy node is harmless when
    // it agrees with the cached chain. A lower tip with a different id is a
    // rollback or fork and must trigger recovery.
    if (incomingLatestHeight < cachedLatestHeight) {
      const cachedTip = this.byHeight.get(incomingLatestHeight);

      if (!cachedTip || cachedTip.id !== incoming[0].id) {
        return false;
      }
    }

    return !incoming.some((block) => {
      const cachedBlock = this.byHeight.get(Number(block.height));
      return cachedBlock && cachedBlock.id !== block.id;
    });
  }
}

module.exports = {
  BlocksStatistics,
  RollingBlocksWindow,
};
