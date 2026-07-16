const CACHE_VERSION = 1;

/**
 * Merge observation metadata from the live delegate object or the persisted roster.
 * @param {?Object} existing Delegate from the previous active-list refresh
 * @param {?Object} persisted Delegate observation restored from Redis
 * @param {boolean} rosterKnown Whether an earlier active roster is available
 * @param {number} networkRound Current forging round
 * @returns {Object} Observation fields to attach to the refreshed delegate
 */
function getDelegateObservationState(existing, persisted, rosterKnown, networkRound) {
  const previous = existing ?? persisted;

  return {
    activeSinceRound: previous
      ? (previous.activeSinceRound ?? null)
      : rosterKnown
        ? networkRound
        : null,
    scheduledSinceRound: previous?.scheduledSinceRound ?? null,
    isScheduled: previous?.isScheduled,
    historyRoundCount: existing?.historyRoundCount,
  };
}

/**
 * Serialize the current active roster and its observation boundaries for Redis.
 * Stable public-key ordering prevents writes when only delegate rank changes.
 * @param {Array<Object>} delegates Current active delegates
 * @returns {string} Versioned Redis payload
 */
function serializeActiveDelegateState(delegates) {
  const entries = delegates
    .map((delegate) => [
      delegate.publicKey,
      {
        activeSinceRound: delegate.activeSinceRound ?? null,
        scheduledSinceRound: delegate.scheduledSinceRound ?? null,
        isScheduled: delegate.isScheduled === true,
      },
    ])
    .sort(([left], [right]) => left.localeCompare(right));

  return JSON.stringify({
    version: CACHE_VERSION,
    delegates: Object.fromEntries(entries),
  });
}

/**
 * Parse a persisted active roster. Invalid or empty data is ignored so a broken
 * cache cannot classify every established delegate as newly active.
 * @param {string} json Redis payload
 * @returns {?Map<string, Object>} Delegate state indexed by public key
 */
function parseActiveDelegateState(json) {
  const cached = JSON.parse(json);

  if (
    cached?.version !== CACHE_VERSION ||
    !cached.delegates ||
    typeof cached.delegates !== 'object' ||
    Array.isArray(cached.delegates)
  ) {
    return null;
  }

  const entries = Object.entries(cached.delegates).filter(
    ([publicKey, state]) => publicKey && state && typeof state === 'object',
  );

  return entries.length ? new Map(entries) : null;
}

module.exports = {
  getDelegateObservationState,
  parseActiveDelegateState,
  serializeActiveDelegateState,
};
