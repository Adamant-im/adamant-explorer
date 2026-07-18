/** Maximum age of a header update before the connection is considered delayed. */
export const NETWORK_UPDATE_MAX_AGE_SECONDS = 15;

/**
 * Derives the public network-health label from data freshness and the number
 * of operational delegates reported by the Delegate Monitor status model.
 *
 * @param {Object} input Network-health inputs
 * @param {boolean} input.hasStatus Whether a node status payload is available
 * @param {number|null} input.secondsSinceUpdate Age of the latest header update
 * @param {number|null} input.forgingDelegates Operational active delegates
 * @returns {{tone: string, label: string}} Header status descriptor
 */
export function networkHealthStatus({ hasStatus, secondsSinceUpdate, forgingDelegates }) {
  if (!hasStatus || secondsSinceUpdate === null) {
    return { tone: 'connecting', label: 'Connecting to network' };
  }

  if (secondsSinceUpdate > NETWORK_UPDATE_MAX_AGE_SECONDS) {
    return { tone: 'delayed', label: 'Updates delayed' };
  }

  if (forgingDelegates === null) {
    return { tone: 'connecting', label: 'Connecting to network' };
  }

  if (forgingDelegates >= 80) {
    return { tone: 'online', label: 'Network live' };
  }

  if (forgingDelegates >= 51) {
    return { tone: 'degraded', label: 'Network degraded' };
  }

  return { tone: 'critical', label: 'Network critical' };
}
