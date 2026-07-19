const { parseIntegerParameter } = require('./validation');

/**
 * Build pagination info for the given offset and blockchain height
 * @param {Number} n
 * @param {Number} height
 * @returns {Object}
 */
function pagination(n, height) {
  const pagination = {};

  pagination.currentPage = parseInt(n / 20) + 1;

  let totalPages = parseInt(height / 20);
  if (totalPages < height / 20) {
    totalPages++;
  }

  if (pagination.currentPage < totalPages) {
    pagination.before = true;
    pagination.previousPage = pagination.currentPage + 1;
  }

  if (pagination.currentPage > 0) {
    pagination.more = true;
    pagination.nextPage = pagination.currentPage - 1;
  }

  return pagination;
}

/**
 * Parse a strict non-negative block offset or return zero.
 * @param {*} value Candidate offset
 * @returns {number} Parsed offset or zero
 */
function offset(value) {
  try {
    return parseIntegerParameter(value, {
      name: 'n',
      defaultValue: 0,
      maximum: 200_000_000,
    });
  } catch {
    return 0;
  }
}

/**
 * Format blocks data
 * @param {Array} blocks
 * @returns {Array}
 */
function map(blocks) {
  return blocks.map((b) => {
    return {
      id: b.id,
      timestamp: b.timestamp,
      generator: b.generatorId,
      totalAmount: b.totalAmount,
      totalFee: b.totalFee,
      reward: b.reward,
      totalForged: b.totalForged,
      transactionsCount: b.numberOfTransactions,
      height: b.height,
      delegate: b.delegate,
    };
  });
}

/**
 * Format block data
 * @param {Object} block
 * @param {Number} height
 * @returns {Object}
 */
function makeBody(block, height) {
  block.confirmations = height - block.height + 1;
  block.payloadHash = Buffer.from(block.payloadHash).toString('hex');

  return block;
}

module.exports = {
  pagination,
  offset,
  map,
  makeBody,
};
