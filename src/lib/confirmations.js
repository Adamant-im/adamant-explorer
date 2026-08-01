/**
 * Calculates live confirmations from an item's inclusion height and the
 * network height. The API value remains the fallback for unconfirmed or
 * incomplete payloads.
 *
 * @param {number|string} itemHeight Block height containing the item
 * @param {number|string} networkHeight Current blockchain height
 * @param {number|string} [fallback=0] Confirmations reported by the API
 * @returns {number} Non-negative confirmation count
 */
export function liveConfirmations(itemHeight, networkHeight, fallback = 0) {
  const includedAt = Number(itemHeight);
  const currentHeight = Number(networkHeight);
  const reported = Number(fallback);

  if (
    Number.isSafeInteger(includedAt) &&
    includedAt > 0 &&
    Number.isSafeInteger(currentHeight) &&
    currentHeight >= includedAt
  ) {
    return currentHeight - includedAt + 1;
  }

  return Number.isFinite(reported) && reported > 0 ? Math.trunc(reported) : 0;
}
