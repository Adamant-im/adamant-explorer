const api = require('./api');

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
 * ADAMANT Node currently exposes only the first top-accounts page to public
 * callers because `/api/accounts/top` rejects numeric query strings. Explorer
 * applies pagination to that available page until the node API supports
 * offset/limit over HTTP query parameters.
 * @param {{offset: number, limit: number}} query Pagination parameters
 * @returns {Promise<Array>} List of accounts
 * @throws {string} Node error message when the request fails
 */
async function getTopAccounts(query) {
  const response = await api.get('accounts/top');

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.accounts.slice(query.offset, query.offset + query.limit);
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
 * Uses the SDK helper, which memoizes resolved keys. Never rejects: an
 * uninitialized account has no public key, which is an expected state,
 * so any failure resolves to `null`.
 * @param {string} address ADAMANT address
 * @returns {Promise<string|null>} Public key or `null` when unavailable
 */
async function getPublicKey(address) {
  try {
    const publicKey = await api.getPublicKey(address);

    return publicKey || null;
  } catch {
    return null;
  }
}

module.exports = {
  getAccountByAddress,
  getAccountByPublicKey,
  getTopAccounts,
  getIncomingTxsCnt,
  getOutgoingTxsCnt,
  getPublicKey,
};
