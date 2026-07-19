/**
 * Minimal client for the explorer's own REST API.
 *
 * All endpoints are same-origin GET requests under `/api` and answer with
 * JSON that carries a `success` flag; on failure the payload usually
 * contains an `error` message. This wrapper normalizes both transport
 * errors and `success: false` responses into thrown errors so callers
 * deal with a single failure path.
 */

const SUPPORTED_API_PATHS = new Set([
  '/api/getAccount',
  '/api/getTopAccounts',
  '/api/getLastBlocks',
  '/api/getBlock',
  '/api/totalSupply',
  '/api/search',
  '/api/getTransaction',
  '/api/getLastTransfers',
  '/api/getTransactionsByAddress',
  '/api/getTransfersByAddress',
  '/api/getTransactionsByBlock',
  '/api/delegates/getStandby',
  '/api/networkHealth',
]);

/**
 * Whether a path is part of the Explorer UI's intentionally retained API surface.
 *
 * Keeping the allowlist next to the client prevents accidental calls to removed
 * legacy endpoints and prevents caller-controlled paths from becoming arbitrary
 * same-origin or cross-origin requests.
 *
 * @param {unknown} path Candidate request path
 * @returns {boolean} True only for an exact supported API path
 */
export function isSupportedApiPath(path) {
  return typeof path === 'string' && SUPPORTED_API_PATHS.has(path);
}

/**
 * Performs a GET request against the explorer API.
 *
 * @param {string} path API path starting with `/api`
 * @param {Object<string, string|number>} [params] Query parameters; `undefined` and `''` values are skipped
 * @returns {Promise<Object>} Parsed response body
 * @throws {Error} When the HTTP request fails or returns a non-2xx status
 */
export async function apiGet(path, params = {}) {
  if (!isSupportedApiPath(path)) {
    throw new Error(`Unsupported Explorer API path: ${String(path)}`);
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  const response = await fetch(queryString ? `${path}?${queryString}` : path);

  if (!response.ok) {
    throw new Error(`API request ${path} failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Performs a GET request and rejects when the API reports `success: false`.
 *
 * Use this for endpoints where a failed lookup should abort the page flow,
 * for example a block or transaction that does not exist.
 *
 * @param {string} path API path starting with `/api`
 * @param {Object<string, string|number>} [params] Query parameters
 * @returns {Promise<Object>} Response body with `success: true`
 * @throws {Error} When the request fails or the API reports an error
 */
export async function apiGetOrThrow(path, params = {}) {
  const data = await apiGet(path, params);

  if (!data.success) {
    throw new Error(data.error || `API request ${path} was not successful`);
  }

  return data;
}
