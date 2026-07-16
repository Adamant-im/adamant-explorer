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
