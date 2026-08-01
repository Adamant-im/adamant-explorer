import { reactive } from 'vue';

/**
 * Natural-order comparison that sorts embedded numbers by value
 * (`'9.9.9' < '10.0.0'`), replacing the legacy angular-naturalsort
 * dependency. Strings compare case-insensitively.
 */
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/**
 * Reads a possibly nested property by dot path, e.g. `'location.hostname'`.
 *
 * @param {Object} obj Source object
 * @param {string} path Dot-separated property path
 * @returns {*} Property value or `undefined`
 */
function getByPath(obj, path) {
  return path.split('.').reduce((value, key) => value?.[key], obj);
}

/**
 * Creates reactive client-side sorting state for a table.
 *
 * Clicking the same column twice flips the direction; switching to a new
 * column resets to ascending — the exact behavior of the legacy `orderBy`
 * service.
 *
 * @param {string} initialKey Dot-path of the column to sort by initially
 * @param {boolean} [initialReverse] Start with descending order
 * @returns {{key: string, reverse: boolean, order: Function, sorted: Function}}
 *   Reactive sort state: `order(key)` toggles, `sorted(rows)` returns a sorted copy
 */
export function useSort(initialKey, initialReverse = false) {
  const state = reactive({
    key: initialKey,
    reverse: initialReverse,

    /**
     * Selects the sort column or flips the direction for the active one.
     * @param {string} key Dot-path of the column
     */
    order(key) {
      state.reverse = state.key === key ? !state.reverse : false;
      state.key = key;
    },

    /**
     * Returns a sorted shallow copy of the rows by the active column.
     * @param {Array<Object>} rows Rows to sort
     * @returns {Array<Object>} Sorted copy
     */
    sorted(rows) {
      if (!Array.isArray(rows)) {
        return [];
      }

      const copy = [...rows];

      copy.sort((a, b) => {
        const left = getByPath(a, state.key);
        const right = getByPath(b, state.key);

        if (typeof left === 'number' && typeof right === 'number') {
          return left - right;
        }

        return collator.compare(String(left ?? ''), String(right ?? ''));
      });

      return state.reverse ? copy.reverse() : copy;
    },
  });

  return state;
}
