import {
  ADAMANT_ADDRESS_PATTERN,
  MAX_UINT64,
  UNSIGNED_DECIMAL_PATTERN,
} from '../../api/lib/adamant/constants.mjs';

const SEARCH_RESULT_ROUTES = new Map([
  [
    'address',
    Object.freeze({
      name: 'address',
      parameter: 'address',
      normalizeIdentifier: normalizeAddressIdentifier,
    }),
  ],
  [
    'block',
    Object.freeze({
      name: 'block',
      parameter: 'blockId',
      normalizeIdentifier: normalizeUnsignedIdentifier,
    }),
  ],
  [
    'tx',
    Object.freeze({
      name: 'transaction',
      parameter: 'txId',
      normalizeIdentifier: normalizeUnsignedIdentifier,
    }),
  ],
]);

/** Normalize an ADAMANT address under the shared backend contract. */
function normalizeAddressIdentifier(value) {
  if (!ADAMANT_ADDRESS_PATTERN.test(value) || BigInt(value.slice(1)) > MAX_UINT64) {
    return null;
  }

  return `U${value.slice(1)}`;
}

/** Normalize a canonical unsigned uint64 identifier. */
function normalizeUnsignedIdentifier(value) {
  if (!UNSIGNED_DECIMAL_PATTERN.test(value) || BigInt(value) > MAX_UINT64) {
    return null;
  }

  return value;
}

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

  if (!route) {
    return null;
  }

  id = route.normalizeIdentifier(id);

  if (id === null) {
    return null;
  }

  return {
    name: route.name,
    params: { [route.parameter]: id },
  };
}
