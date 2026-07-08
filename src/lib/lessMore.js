import { reactive } from 'vue';
import { apiGet } from './api.js';

/**
 * Incremental "Less / More" pagination over a list endpoint of the
 * explorer API, a Vue port of the legacy `LessMore` service.
 *
 * The loader always requests `limit + 1` rows: the presence of the extra
 * row signals that more data exists, and the extra row itself is dropped
 * before display.
 *
 * @param {Object} options Loader configuration
 * @param {string} options.url API path, e.g. `/api/getTransfersByAddress`
 * @param {string} options.key Response property holding the rows, e.g. `'transactions'`
 * @param {string} [options.parent] Entity name used in "no results" messages, e.g. `'address'`
 * @param {number} [options.limit] Page size, defaults to 50
 * @param {number} [options.maximum] Hard cap on the total number of loaded rows
 * @param {Object<string, string|number>} [options.params] Extra query parameters sent with every request
 * @returns {Object} Reactive loader with `results`, `loading`, `moreData`,
 *   `lessData` state and `loadData()`, `loadMore()`, `loadLess()` actions
 */
export function useLessMore({
  url,
  key,
  parent = 'parent',
  limit = 50,
  maximum = 2000,
  params = {},
}) {
  const state = reactive({
    results: [],
    loading: true,
    moreData: false,
    lessData: false,
    error: null,
    parent,
    offset: 0,
    // Number of rows removed by the next "Less" click
    splice: 0,

    /** @returns {boolean} True when neither direction has data to page */
    disabled() {
      return !state.moreData && !state.lessData;
    },

    /** Loads the first page, replacing current results. */
    async loadData() {
      state.results = [];
      state.offset = 0;
      await load(0);
    },

    /** Loads the next page and appends it to the results. */
    async loadMore() {
      // When new rows appeared on top since the last load (live chain),
      // appending by offset would duplicate rows; reload from scratch
      // up to the current depth instead.
      const probe = await getRows(0, 1);

      if (state.results[0] && probe[0] && state.results[0].id !== probe[0].id) {
        await reload();
        return;
      }

      await load(state.offset);
    },

    /** Drops the rows added by the latest "More" click. */
    loadLess() {
      state.lessData = false;
      state.moreData = true;
      state.results.splice(-state.splice, state.splice);
      state.lessData = anyLess(state.results.length);
      state.offset -= limit;
    },
  });

  /**
   * Fetches raw rows from the endpoint.
   * @param {number} offset Row offset
   * @param {number} count Number of rows to request
   * @returns {Promise<Array<Object>>} Rows, empty array on API failure
   */
  async function getRows(offset, count) {
    const data = await apiGet(url, { ...params, offset, limit: count });

    if (!data.success || !Array.isArray(data[key])) {
      return [];
    }

    return data[key];
  }

  /**
   * Loads one page at the given offset and appends it.
   * @param {number} offset Row offset to load from
   */
  async function load(offset) {
    state.loading = true;
    state.moreData = false;
    state.lessData = false;
    state.error = null;

    try {
      const rows = await getRows(offset, limit + 1);

      // The extra probe row indicates more data behind this page
      if (rows.length === limit + 1) {
        state.moreData = true;
        rows.splice(-1, 1);
      }

      state.results = state.results.concat(rows);

      if (state.results.length + limit > maximum) {
        state.moreData = false;
      }

      state.lessData = anyLess(state.results.length);
      state.offset += limit;
    } catch (error) {
      state.error = error;
    } finally {
      state.loading = false;
    }
  }

  /** Reloads every already-loaded page from offset zero. */
  async function reload() {
    const depth = state.offset + limit;

    state.results = [];
    state.offset = 0;

    for (let offset = 0; offset < depth; offset += limit) {
      await load(offset);
    }
  }

  /**
   * @param {number} length Current number of loaded rows
   * @returns {boolean} Whether a "Less" step is possible
   */
  function anyLess(length) {
    if (length > limit) {
      const mod = length % limit;
      state.splice = mod === 0 ? limit : mod;
      return true;
    }

    state.splice = 0;
    return false;
  }

  return state;
}
