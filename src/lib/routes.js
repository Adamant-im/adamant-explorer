const SEARCH_RESULT_ROUTES = new Map([
  [
    'address',
    Object.freeze({ name: 'address', parameter: 'address', idPattern: /^[Uu]\d{1,21}$/ }),
  ],
  ['block', Object.freeze({ name: 'block', parameter: 'blockId', idPattern: /^\d{1,21}$/ })],
  ['tx', Object.freeze({ name: 'transaction', parameter: 'txId', idPattern: /^\d{1,21}$/ })],
]);

/**
 * Builds a named Vue Router target for a successful Explorer search response.
 *
 * The API response is treated as untrusted network data. Both the result type
 * and identifier must match the formats produced by the retained search route,
 * so unexpected values cannot alter the destination path or query string.
 *
 * @param {unknown} result Explorer search response
 * @returns {{name: string, params: Object<string, string>}|null} Safe named route, or `null`
 */
export function searchResultRoute(result) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const route = SEARCH_RESULT_ROUTES.get(result.type);
  let id;

  if (typeof result.id === 'string') {
    id = result.id;
  } else if (Number.isSafeInteger(result.id) && result.id >= 0) {
    id = String(result.id);
  } else {
    return null;
  }

  if (!route || !route.idPattern.test(id)) {
    return null;
  }

  return {
    name: route.name,
    params: { [route.parameter]: id },
  };
}
