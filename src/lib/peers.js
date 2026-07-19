const PLATFORM_NAMES = new Set(['darwin', 'linux', 'win', 'freebsd', 'unknown']);
const PEER_STATES = new Set(['0', '1', '2']);

/**
 * Returns a supported peer platform name for icon and marker class selection.
 *
 * @param {unknown} value Platform name from a peer payload
 * @returns {'darwin'|'linux'|'win'|'freebsd'|'unknown'} Allowlisted platform name
 */
export function peerPlatformName(value) {
  return typeof value === 'string' && PLATFORM_NAMES.has(value.toLowerCase())
    ? value.toLowerCase()
    : 'unknown';
}

/**
 * Builds the country flag class from an ISO 3166-1 alpha-2 code.
 *
 * @param {unknown} value Country code from geo-location data
 * @returns {string} Safe flag class, or an empty string when the code is invalid
 */
export function peerFlagClass(value) {
  const code = typeof value === 'string' ? value.trim().toLowerCase() : '';

  return /^[a-z]{2}$/.test(code) ? `flag-${code}` : '';
}

/**
 * Builds the peer state class without accepting arbitrary class tokens.
 *
 * @param {unknown} value ADAMANT peer state (`0`, `1`, or `2`)
 * @returns {string} Safe state class; unknown values use a non-styled fallback
 */
export function peerStateClass(value) {
  const state = String(value);

  return PEER_STATES.has(state) ? `state-${state}` : 'state-unknown';
}

/**
 * Extracts usable Leaflet coordinates from a peer payload.
 *
 * @param {Object} peer Enriched peer
 * @returns {[number, number]|null} Latitude/longitude tuple, or `null`
 */
export function peerCoordinates(peer) {
  const latitude = peer?.location?.latitude;
  const longitude = peer?.location?.longitude;

  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
}

/**
 * Selects the textual fields shown in a peer map popup.
 *
 * Values stay as plain text and are inserted with DOM text nodes by the view.
 * Objects and other unexpected payload values are omitted instead of invoking
 * attacker-influenced coercion behavior.
 *
 * @param {Object} peer Enriched peer
 * @returns {Array<{label: string, value: string, className?: string}>} Popup rows
 */
export function peerPopupRows(peer) {
  const location = peer?.location ?? {};
  const rows = [
    { label: '', value: peer?.ip, className: 'ip' },
    { label: 'Hostname', value: location.hostname },
    { label: 'Version', value: peer?.version },
    { label: 'OS', value: peer?.os },
    { label: 'City', value: location.city },
    { label: 'Region', value: location.region_name },
    { label: 'Country', value: location.country_name },
  ];

  return rows
    .filter(({ value }) => typeof value === 'string' || typeof value === 'number')
    .map(({ label, value, className }) => ({
      label,
      value: String(value),
      ...(className ? { className } : {}),
    }))
    .filter(({ value }) => value.length > 0);
}

/**
 * Compare dotted software versions from newest to oldest.
 *
 * Numeric comparison is required because lexicographic ordering incorrectly
 * places `0.9.0` before `0.10.2`.
 * @param {string} left First version
 * @param {string} right Second version
 * @returns {number} Sort comparator result for descending order
 */
export function compareVersionsDescending(left, right) {
  return String(right).localeCompare(String(left), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

/**
 * Groups peer heights into three-block bands anchored at the maximum.
 *
 * A peer at max, max - 1, or max - 2 is considered synchronized with the
 * best height. When that band contains at least 90% of peers, every
 * remaining height is summarized as "other".
 * @param {Array<number|string>} heights Connected peer heights
 * @returns {{groups: Array<{height: number, count: number, percent: number}>, otherCount: number, otherPercent: number}}
 *   Visible height bands and the summarized remainder
 */
export function groupPeerHeights(heights) {
  const valid = heights.map(Number).filter((height) => Number.isFinite(height));

  if (!valid.length) {
    return { groups: [], otherCount: 0, otherPercent: 0 };
  }

  const maximum = Math.max(...valid);
  const counts = new Map();

  for (const height of valid) {
    const groupHeight = maximum - Math.floor((maximum - height) / 3) * 3;
    counts.set(groupHeight, (counts.get(groupHeight) || 0) + 1);
  }

  const allGroups = [...counts.entries()]
    .sort(([left], [right]) => right - left)
    .map(([height, count]) => ({
      height,
      count,
      percent: Math.round((count / valid.length) * 100),
    }));
  const visibleCount = allGroups[0].percent >= 90 ? 1 : 4;
  const groups = allGroups.slice(0, visibleCount);
  const otherCount = allGroups.slice(visibleCount).reduce((sum, group) => sum + group.count, 0);

  return {
    groups,
    otherCount,
    otherPercent: Math.round((otherCount / valid.length) * 100),
  };
}
