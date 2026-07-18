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
