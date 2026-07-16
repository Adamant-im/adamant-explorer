const api = require('./api');
const { BLOCKS_PAGE_SIZE } = require('../constants');
const logger = require('../../../../utils/log');

/**
 * Get the current blockchain height.
 * @returns {Promise<number>} Height of the last block
 * @throws {string} Node error message when the request fails
 */
async function getBlockHeight() {
  const response = await api.getHeight();

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.height;
}

/**
 * Get a block by its id.
 * @param {string} blockId Block id
 * @returns {Promise<{block: Object, nodeTimestamp: number}>} Block body and node timestamp
 * @throws {string} Node error message when the request fails or the block is not found
 */
async function getBlockById(blockId) {
  const response = await api.getBlock(blockId);

  if (!response.success) {
    throw response.errorMessage;
  }

  return { block: response.block, nodeTimestamp: response.nodeTimestamp };
}

/**
 * Get a block by its height.
 * @param {number} height Block height
 * @returns {Promise<{block: Object, nodeTimestamp: number}>} Block body and node timestamp
 * @throws {string} Node error message when the request fails or no block exists at the height
 */
async function getBlockByHeight(height) {
  const response = await api.getBlocks({ height });

  if (!response.success || !response.blocks.length) {
    throw response.errorMessage || `No block at height ${height}`;
  }

  return { block: response.blocks[0], nodeTimestamp: response.nodeTimestamp };
}

/**
 * Get the latest blocks in descending order by height.
 * @param {number} offset Number of blocks to skip
 * @param {number} [limit=20] Maximum number of blocks to return
 * @returns {Promise<Array>} List of blocks
 * @throws {string} Node error message when the request fails
 */
async function getBlocks(offset, limit = 20) {
  const response = await api.getBlocks({ orderBy: 'height:desc', offset, limit });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.blocks;
}

/**
 * Get a bounded window of latest blocks across node pages.
 *
 * ADAMANT Node accepts at most 100 blocks per request. This helper keeps the
 * pagination rule inside the request layer while guaranteeing that callers
 * cannot accidentally request an unbounded scan.
 * @param {number} count Maximum number of blocks to return
 * @param {number} [offset=0] Number of latest blocks to skip
 * @returns {Promise<Array>} Blocks in descending height order
 * @throws {string} Node error message when any page request fails
 */
async function getBlocksWindow(count, offset = 0) {
  const blocks = [];
  let currentOffset = offset;

  while (blocks.length < count) {
    const pageSize = Math.min(BLOCKS_PAGE_SIZE, count - blocks.length);
    const page = await getBlocks(currentOffset, pageSize);

    blocks.push(...page);

    if (page.length < pageSize) {
      break;
    }

    currentOffset += page.length;
  }

  return blocks;
}

/**
 * Get blockchain network status: height, fee, milestone, reward, supply, and nethash.
 * @returns {Promise<Object>} Network status payload
 * @throws {string} Node error message when the request fails
 */
async function getBlockStatus() {
  const response = await api.getStatus();

  if (!response.success) {
    throw response.errorMessage;
  }

  return response;
}

/**
 * Get the last forged block.
 * @returns {Promise<Object>} Block body
 * @throws {string} Node error message when the request fails or no blocks are returned
 */
async function getLastBlock() {
  const response = await api.getBlocks({ orderBy: 'height:desc', limit: 1 });

  if (!response.success || !response.blocks.length) {
    throw response.errorMessage || 'No blocks returned by the node';
  }

  return response.blocks[0];
}

/**
 * Get the latest blocks forged by the given delegate.
 * @param {string} publicKey Delegate generator public key
 * @returns {Promise<Array>} List of blocks, empty when the delegate has not forged yet
 * @throws {string} Node error message when the request fails
 */
async function getLastBlocksByGeneratorPublicKey(publicKey) {
  const response = await api.getBlocks({ orderBy: 'height:desc', generatorPublicKey: publicKey });

  if (!response.success) {
    throw response.errorMessage;
  }

  return Array.isArray(response.blocks) ? response.blocks : [];
}

/**
 * Subscribe to compact new-block notifications from a healthy Node.
 * The SDK owns reconnection and moves the socket when its health check selects
 * a different synchronized node.
 * @param {(block: Object) => void|Promise<void>} handler New-block callback
 * @returns {Function} Unsubscribe callback
 */
function onNewBlock(handler) {
  let initialized = false;

  if (!api.socket) {
    // Initialize lazily so command-line consumers and unit tests that only use
    // REST do not open an unnecessary long-lived socket.
    api.initSocket({});
    initialized = true;
  }

  api.socket.onNewBlock(handler);

  if (initialized) {
    Promise.resolve(api.updateNodes()).catch((error) => {
      logger.error(`ADAMANT WebSocket health check: ${error}`);
    });
  }

  return () => api.socket.off(handler);
}

module.exports = {
  getBlockHeight,
  getBlockById,
  getBlockByHeight,
  getBlocks,
  getBlocksWindow,
  getBlockStatus,
  getLastBlock,
  getLastBlocksByGeneratorPublicKey,
  onNewBlock,
};
