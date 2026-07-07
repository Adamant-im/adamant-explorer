const api = require('./api');

/**
 * Get delegate info by public key.
 * @param {string} publicKey Delegate public key
 * @param {boolean} [rejectUnsuccessful] Throw instead of resolving with `null`
 *   when the account is not a delegate
 * @returns {Promise<Object|null|undefined>} Delegate body, `null` when the account
 *   is not a delegate, or `undefined` when no public key is given
 * @throws {string} Node error message when `rejectUnsuccessful` is set and no delegate is found
 */
async function getDelegate(publicKey, rejectUnsuccessful) {
  if (!publicKey) {
    return undefined;
  }

  const response = await api.getDelegate({ publicKey });

  const delegate = response.success ? response.delegate : null;

  if (rejectUnsuccessful && delegate === null) {
    throw response.errorMessage;
  }

  return delegate;
}

/**
 * Get delegates the account votes for.
 * @param {string} address Voter's ADAMANT address
 * @returns {Promise<Array|null|undefined>} List of delegates, `null` when there are
 *   no votes, or `undefined` when no address is given
 */
async function getVotes(address) {
  if (!address) {
    return undefined;
  }

  const response = await api.getVoteData(address);

  if (!response.success) {
    return null;
  }

  return response.delegates?.length ? response.delegates : null;
}

/**
 * Get accounts that vote for a delegate.
 * @param {string} publicKey Delegate public key
 * @returns {Promise<Array|null>} List of voter accounts or `null` when there are none
 */
async function getVoters(publicKey) {
  const response = await api.getVoters(publicKey);

  if (!response.success) {
    return null;
  }

  return response.accounts?.length ? response.accounts : null;
}

/**
 * Get the total amount of ADM forged by a delegate.
 * @param {string} publicKey Delegate generator public key
 * @returns {Promise<string|number>} Forged amount in 1/10^8 ADM, `0` when unavailable
 */
async function getForged(publicKey) {
  const response = await api.getDelegateStats(publicKey);

  return response.success ? response.forged : 0;
}

/**
 * Get the 101 active delegates ordered by rank.
 * @returns {Promise<Object>} Payload with `delegates` and `totalCount`
 * @throws {string} Node error message when the request fails
 */
async function getActive() {
  const response = await api.getDelegates({ orderBy: 'rate:asc', limit: 101 });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response;
}

/**
 * Get standby delegates, ordered by rank.
 * @param {number} offset Number of delegates to skip, at least 101
 * @param {number} limit Maximum number of delegates to return
 * @returns {Promise<Object>} Payload with `delegates` and `totalCount`
 * @throws {string} Node error message when the request fails
 */
async function getStandby(offset, limit) {
  const response = await api.getDelegates({ orderBy: 'rate:asc', limit, offset });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response;
}

/**
 * Find a delegate address by username.
 * @param {string} username Delegate username, e.g. `adm_official_pool`
 * @returns {Promise<string>} Delegate ADAMANT address
 * @throws {string} `'Delegate not found'` or a node error message
 */
async function getSearch(username) {
  const response = await api.searchDelegates(username);

  if (!response.success) {
    throw response.errorMessage;
  }

  if (!response.delegates?.[0]) {
    throw 'Delegate not found';
  }

  return response.delegates[0].address;
}

/**
 * Get public keys of delegates that will forge next, in forging order.
 * @returns {Promise<Array<string>>} List of delegate public keys
 * @throws {string} Node error message when the request fails
 */
async function getNextForgers() {
  const response = await api.getNextForgers(101);

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.delegates;
}

module.exports = {
  getDelegate,
  getVotes,
  getVoters,
  getForged,
  getActive,
  getStandby,
  getSearch,
  getNextForgers,
};
