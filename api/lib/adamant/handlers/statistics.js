const EventEmitter = require('events');
const blocks = require('../requests/blocks');
const statistics = require('../requests/statistics');
const helpers = require('../helpers/statistics');
const api = require('../requests/api');
const {
  BLOCK_CACHE_RECOVERY_BLOCKS,
  BLOCK_INTERVAL_MILLISECONDS,
  BLOCKS_PAGE_SIZE,
  BLOCK_STATISTICS_WINDOW_BLOCKS,
} = require('../constants');
const logger = require('../../../../utils/log');

const locator = new helpers.Locator();
const blockWindow = new helpers.RollingBlocksWindow();
const blockStatisticsEvents = new EventEmitter();
const BLOCK_STATISTICS_REST_REFRESH_INTERVAL = BLOCK_INTERVAL_MILLISECONDS * 6;
const BLOCK_STATISTICS_PERSIST_INTERVAL = 300000;
const BLOCK_STATISTICS_CACHE_KEY = 'adamant-explorer:block-statistics:v1';
const BLOCK_STATISTICS_CACHE_VERSION = 1;

let blockStatistics = null;
let blockStatisticsQueue = Promise.resolve();
let blockStatisticsStart = null;
let blockStatisticsTimer = null;
let blockStatisticsPersistTimer = null;
let redisClient = null;
let unsubscribeFromNewBlocks = null;

/** Serialize mutations so WebSocket events cannot race REST recovery. */
function queueBlockStatisticsUpdate(callback) {
  const result = blockStatisticsQueue.then(callback, callback);
  blockStatisticsQueue = result.catch(() => {});
  return result;
}

/** Recalculate and publish statistics from the current rolling window. */
function publishBlockStatistics(source) {
  const aggregate = new helpers.BlocksStatistics(BLOCK_STATISTICS_WINDOW_BLOCKS);
  aggregate.inspect(blockWindow.blocks);

  blockStatistics = {
    best: aggregate.best.block,
    volume: {
      ...aggregate.volume,
      ...blockWindow.coverage,
    },
    success: true,
  };

  blockStatisticsEvents.emit('update', {
    blocks: blockStatistics,
    lastBlock: blockWindow.blocks[0] ?? null,
    source,
  });

  return blockStatistics;
}

/** Restore the last contiguous window saved by this Explorer instance. */
async function restoreBlockStatistics() {
  if (!redisClient) {
    return false;
  }

  try {
    const json = await redisClient.get(BLOCK_STATISTICS_CACHE_KEY);

    if (!json) {
      return false;
    }

    const cached = JSON.parse(json);

    if (
      cached.version !== BLOCK_STATISTICS_CACHE_VERSION ||
      !Array.isArray(cached.blocks) ||
      !cached.blocks.length
    ) {
      return false;
    }

    const result = blockWindow.replace(cached.blocks);

    if (result.rejected || !blockWindow.blocks.length) {
      return false;
    }

    publishBlockStatistics('redis');
    return true;
  } catch (error) {
    logger.warn(`Block statistics cache: Failed to restore Redis window: ${error}`);
    return false;
  }
}

/** Persist the rolling window without an expiry so restarts retain its history. */
async function persistBlockStatistics() {
  if (!redisClient || !blockWindow.blocks.length) {
    return;
  }

  try {
    await redisClient.set(
      BLOCK_STATISTICS_CACHE_KEY,
      JSON.stringify({
        version: BLOCK_STATISTICS_CACHE_VERSION,
        blocks: blockWindow.blocks,
      }),
    );
  } catch (error) {
    logger.warn(`Block statistics cache: Failed to persist Redis window: ${error}`);
  }
}

/**
 * Reconcile the shared rolling window with the Node REST API.
 * Startup and any discontinuity load 300 blocks; routine checks load one page.
 * @param {boolean} [forceRecovery=false] Replace the cache with 300 recent blocks
 * @param {number} [requestedCount=100] Blocks to merge during a normal reconciliation
 * @returns {Promise<Object>} Current public block statistics
 */
function refreshBlockStatistics(forceRecovery = false, requestedCount = BLOCKS_PAGE_SIZE) {
  return queueBlockStatisticsUpdate(async () => {
    const recovery = forceRecovery || !blockWindow.blocks.length;
    const count = recovery ? BLOCK_CACHE_RECOVERY_BLOCKS : requestedCount;
    const data = await blocks.getBlocksWindow(count);

    if (!data.length) {
      throw new Error('No blocks returned by the Node REST API');
    }

    const result = recovery ? blockWindow.replace(data) : blockWindow.merge(data);

    if (result.rejected) {
      throw new Error('Node REST API returned a non-contiguous block page');
    }

    if (result.reset && !recovery) {
      if (count >= BLOCK_CACHE_RECOVERY_BLOCKS) {
        await persistBlockStatistics();
        return publishBlockStatistics('rest-recovery');
      }

      const recoveryBlocks = await blocks.getBlocksWindow(BLOCK_CACHE_RECOVERY_BLOCKS);

      if (!recoveryBlocks.length) {
        throw new Error('No blocks returned during REST cache recovery');
      }

      const recoveryResult = blockWindow.replace(recoveryBlocks);

      if (recoveryResult.rejected) {
        throw new Error('Node REST API returned a non-contiguous recovery window');
      }

      await persistBlockStatistics();
      return publishBlockStatistics('rest-recovery');
    }

    return publishBlockStatistics(recovery ? 'rest-recovery' : 'rest');
  });
}

/**
 * Merge blocks delivered by the SDK WebSocket or a focused REST fallback.
 * A gap, rollback, or fork immediately triggers the same 300-block recovery.
 * @param {Array<Object>} incoming Recent blocks
 * @param {string} [source='external'] Update source used for diagnostics
 * @returns {Promise<Object>} Current public block statistics
 */
function ingestBlocks(incoming, source = 'external') {
  return queueBlockStatisticsUpdate(async () => {
    const result = blockWindow.merge(incoming);

    if (result.reset) {
      const recoveryBlocks = await blocks.getBlocksWindow(BLOCK_CACHE_RECOVERY_BLOCKS);

      if (!recoveryBlocks.length) {
        throw new Error('No blocks returned during block cache recovery');
      }

      const recoveryResult = blockWindow.replace(recoveryBlocks);

      if (recoveryResult.rejected) {
        throw new Error('Node REST API returned a non-contiguous recovery window');
      }

      await persistBlockStatistics();
      return publishBlockStatistics(`${source}-recovery`);
    }

    return publishBlockStatistics(source);
  });
}

/**
 * Start the process-wide Network Monitor accumulator after API readiness.
 * The timer is shared by REST and Socket.IO consumers and does not depend on
 * an open browser page.
 */
async function startBlockStatisticsCache(client) {
  if (client) {
    redisClient = client;
  }

  if (blockStatisticsStart) {
    return blockStatisticsStart;
  }

  blockStatisticsStart = (async () => {
    await api.waitForReady();
    await restoreBlockStatistics();

    try {
      await refreshBlockStatistics(!blockWindow.blocks.length, BLOCK_CACHE_RECOVERY_BLOCKS);
      await persistBlockStatistics();
    } catch (error) {
      logger.error(`Block statistics cache: ${error}`);
    }

    if (!unsubscribeFromNewBlocks) {
      unsubscribeFromNewBlocks = blocks.onNewBlock(async (notification) => {
        let block = notification;

        try {
          // The socket payload is intentionally compact. Confirm and hydrate it
          // over REST so public statistics keep returning the full block shape.
          block = (await blocks.getBlockById(notification.id)).block;
        } catch (error) {
          logger.warn(`Block statistics REST confirmation: ${error}`);
        }

        try {
          await ingestBlocks([block], 'websocket');
        } catch (error) {
          logger.error(`Block statistics WebSocket: ${error}`);
        }
      });
    }

    if (!blockStatisticsTimer) {
      blockStatisticsTimer = setInterval(() => {
        refreshBlockStatistics().catch((error) => {
          logger.error(`Block statistics REST fallback: ${error}`);
        });
      }, BLOCK_STATISTICS_REST_REFRESH_INTERVAL);
    }

    if (!blockStatisticsPersistTimer) {
      blockStatisticsPersistTimer = setInterval(() => {
        persistBlockStatistics().catch((error) => {
          logger.error(`Block statistics persistence: ${error}`);
        });
      }, BLOCK_STATISTICS_PERSIST_INTERVAL);
    }

    return blockStatistics;
  })();

  return blockStatisticsStart;
}

/** Return a copy of the current contiguous block history. */
function getCachedBlocks() {
  return blockWindow.blocks;
}

/** Ensure at least the recovery window is available to status consumers. */
async function ensureBlockStatistics() {
  return blockStatistics ?? refreshBlockStatistics(true);
}

/**
 * Subscribe a process-local consumer to WebSocket and REST block updates.
 * @param {Function} listener Update listener
 * @returns {Function} Unsubscribe callback
 */
function subscribeBlockStatistics(listener) {
  blockStatisticsEvents.on('update', listener);
  return () => blockStatisticsEvents.off('update', listener);
}

/**
 * Get last block
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getLastBlock(error, success) {
  try {
    const result = {};

    result.block = await blocks.getLastBlock();

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get recent blocks statistics
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getBlocks(error, success) {
  try {
    const result = blockStatistics ?? (await refreshBlockStatistics());

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

/**
 * Get peers information
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getPeers(error, success) {
  try {
    const peersStatistics = new helpers.PeersStatistics(locator);

    const limit = 100;
    let offset = 0;
    let found = false;

    do {
      const data = await statistics.getPeers(offset, limit);

      if (data.length > 0) {
        await peersStatistics.collect(data);
      } else {
        found = true;
      }

      offset += limit;
    } while (!(found || offset > helpers.PeersStatistics.maxOffset));

    const result = {};

    peersStatistics.locator.updateCache(peersStatistics.ips);

    result.list = peersStatistics.list;

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

module.exports = {
  ensureBlockStatistics,
  getCachedBlocks,
  getLastBlock,
  getBlocks,
  getPeers,
  ingestBlocks,
  startBlockStatisticsCache,
  subscribeBlockStatistics,
};
