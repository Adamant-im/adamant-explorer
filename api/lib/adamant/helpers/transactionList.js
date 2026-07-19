/**
 * Compare transaction ids as unsigned decimal values when possible.
 *
 * @param {Object} a First transaction
 * @param {Object} b Second transaction
 * @returns {number} Negative when `a` must appear before `b`
 */
function compareTransactionIdsDescending(a, b) {
  const aId = String(a.id ?? '');
  const bId = String(b.id ?? '');

  if (/^\d+$/.test(aId) && /^\d+$/.test(bId)) {
    const aNumericId = BigInt(aId);
    const bNumericId = BigInt(bId);

    if (aNumericId !== bNumericId) {
      return aNumericId > bNumericId ? -1 : 1;
    }
  }

  return bId.localeCompare(aId);
}

/**
 * Resolves a sortable timestamp while keeping malformed transactions after
 * every valid timestamp.
 *
 * @param {Object} transaction Transaction with second or millisecond timestamp
 * @returns {number} Finite timestamp, or negative infinity when malformed
 */
function sortableTimestamp(transaction) {
  const timestamp = Number(transaction.timestampMs ?? Number(transaction.timestamp) * 1000);

  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

/**
 * Sort transactions newest first with deterministic tie breakers.
 *
 * ADAMANT Node accepts one `orderBy` field. Transactions created in a batch
 * can therefore share a timestamp and arrive in a different database order
 * on consecutive requests. Height and id keep the Explorer list stable until
 * a genuinely newer operation appears.
 *
 * @param {Array<Object>} transactions Transaction list to sort
 * @returns {Array<Object>} New sorted array; the input is not mutated
 */
function sortTransactions(transactions) {
  return [...transactions].sort((a, b) => {
    const aTimestamp = sortableTimestamp(a);
    const bTimestamp = sortableTimestamp(b);

    if (aTimestamp !== bTimestamp) {
      return bTimestamp - aTimestamp;
    }

    const aHeight = Number.isSafeInteger(Number(a.height)) ? Number(a.height) : -1;
    const bHeight = Number.isSafeInteger(Number(b.height)) ? Number(b.height) : -1;

    if (aHeight !== bHeight) {
      return bHeight - aHeight;
    }

    return compareTransactionIdsDescending(a, b);
  });
}

/**
 * Merge confirmed and unconfirmed transactions into the latest page.
 *
 * @param {Array<Object>} transactions1 First transaction list
 * @param {Array<Object>} transactions2 Second transaction list
 * @returns {Array<Object>} Up to 20 newest transactions
 */
function concatenateTransactions(transactions1, transactions2) {
  return sortTransactions(transactions1.concat(transactions2)).slice(0, 20);
}

module.exports = {
  concatenateTransactions,
  sortTransactions,
};
