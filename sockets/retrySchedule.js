const BASE_RETRY_DELAY_MILLISECONDS = 10000;
const MAX_RETRY_DELAY_MILLISECONDS = 60000;
const RETRY_JITTER_RATIO = 0.2;

/**
 * Calculate an exponential retry delay with bounded positive jitter.
 *
 * Jitter keeps independent socket namespaces from retrying a failed Node in
 * lockstep, while the cap keeps recovery responsive after a long outage.
 * @param {number} attempt Zero-based consecutive failure count
 * @param {Function} [random=Math.random] Random source returning a value from 0 through 1
 * @returns {number} Delay in milliseconds
 */
function getRetryDelay(attempt, random = Math.random) {
  const normalizedAttempt =
    Number.isSafeInteger(attempt) && attempt > 0 ? Math.min(attempt, 30) : 0;
  const nominalDelay = Math.min(
    MAX_RETRY_DELAY_MILLISECONDS,
    BASE_RETRY_DELAY_MILLISECONDS * 2 ** normalizedAttempt,
  );
  const sample = Math.min(1, Math.max(0, Number(random()) || 0));

  if (nominalDelay === MAX_RETRY_DELAY_MILLISECONDS) {
    const jitter = nominalDelay * RETRY_JITTER_RATIO;
    return Math.round(nominalDelay - jitter + jitter * sample);
  }

  const jitter = Math.min(
    nominalDelay * RETRY_JITTER_RATIO,
    MAX_RETRY_DELAY_MILLISECONDS - nominalDelay,
  );

  return Math.round(nominalDelay + jitter * sample);
}

module.exports = {
  BASE_RETRY_DELAY_MILLISECONDS,
  MAX_RETRY_DELAY_MILLISECONDS,
  getRetryDelay,
};
