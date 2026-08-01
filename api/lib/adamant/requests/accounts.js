const api = require('./api');

/** Public keys are immutable, so successful address lookups can be reused. */
const publicKeyCache = new Map();
const MISSING_PUBLIC_KEY_TTL_MS = 5 * 60 * 1000;
const MAX_PUBLIC_KEY_CACHE_SIZE = 5000;

/**
 * Get an account by its address.
 * @param {string} address ADAMANT address, e.g. `U777355171066438331`
 * @returns {Promise<Object>} Account body
 * @throws {string} Node error message when the request fails or the account is not found
 */
async function getAccountByAddress(address) {
  const response = await api.getAccountInfo({ address });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.account;
}

/**
 * Get an account by its public key.
 * @param {string} publicKey Account public key, a 64-character hex string
 * @returns {Promise<Object>} Account body
 * @throws {string} Node error message when the request fails or the account is not found
 */
async function getAccountByPublicKey(publicKey) {
  const response = await api.getAccountInfo({ publicKey });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.account;
}

/**
 * Get accounts with the highest balances.
 *
 * ADAMANT Node v0.10.2 supports public pagination and returns normalized page
 * metadata through the typed SDK method.
 * @param {{offset: number, limit: number}} query Pagination parameters
 * @returns {Promise<Array>} List of accounts
 * @throws {string} Node error message when the request fails
 */
async function getTopAccounts(query) {
  const response = await api.getTopAccounts(query);

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.accounts;
}

/**
 * Get the number of incoming transactions for an address.
 * @param {string} address ADAMANT address
 * @returns {Promise<number|undefined>} Incoming transactions count, `undefined` when no address is given
 * @throws {string} Node error message when the request fails
 */
async function getIncomingTxsCnt(address) {
  if (!address) {
    return undefined;
  }

  const response = await api.getTransactions({ recipientId: address, limit: 1 });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.count;
}

/**
 * Get the number of outgoing transactions for an address.
 * @param {string} address ADAMANT address
 * @returns {Promise<number|undefined>} Outgoing transactions count, `undefined` when no address is given
 * @throws {string} Node error message when the request fails
 */
async function getOutgoingTxsCnt(address) {
  if (!address) {
    return undefined;
  }

  const response = await api.getTransactions({ senderId: address, limit: 1 });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.count;
}

/**
 * Get the public key of an address.
 *
 * Uses the normalized account endpoint instead of the SDK convenience
 * helper. The helper logs expected "account not found" responses as
 * warnings, which would otherwise flood explorer logs for an
 * uninitialized recipient. Concurrent lookups share one promise.
 * @param {string} address ADAMANT address
 * @returns {Promise<string|null>} Public key or `null` when unavailable
 */
async function getPublicKey(address) {
  if (!address) {
    return null;
  }

  const cached = publicKeyCache.get(address);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const entry = { expiresAt: Infinity, promise: null };

  entry.promise = api
    .getAccountInfo({ address })
    .then((response) => (response.success ? response.account?.publicKey || null : null))
    .catch(() => null)
    .then((publicKey) => {
      entry.expiresAt = publicKey ? Infinity : Date.now() + MISSING_PUBLIC_KEY_TTL_MS;
      return publicKey;
    });

  publicKeyCache.delete(address);
  publicKeyCache.set(address, entry);

  if (publicKeyCache.size > MAX_PUBLIC_KEY_CACHE_SIZE) {
    publicKeyCache.delete(publicKeyCache.keys().next().value);
  }

  return entry.promise;
}

module.exports = {
  getAccountByAddress,
  getAccountByPublicKey,
  getTopAccounts,
  getIncomingTxsCnt,
  getOutgoingTxsCnt,
  getPublicKey,
};
