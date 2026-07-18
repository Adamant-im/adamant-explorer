const api = require('./api');

const delegateCache = new Map();
const MISSING_DELEGATE_TTL_MS = 60 * 1000;
const MAX_DELEGATE_CACHE_SIZE = 5000;

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

  const cached = delegateCache.get(publicKey);
  let request;

  if (cached && cached.expiresAt > Date.now()) {
    request = cached.promise;
  } else {
    const entry = { expiresAt: Infinity, promise: null };

    entry.promise = api.getDelegate({ publicKey }).then((response) => {
      const result = {
        delegate: response.success ? response.delegate : null,
        errorMessage: response.errorMessage,
      };

      entry.expiresAt = result.delegate ? Infinity : Date.now() + MISSING_DELEGATE_TTL_MS;
      return result;
    });

    delegateCache.delete(publicKey);
    delegateCache.set(publicKey, entry);
    request = entry.promise;

    if (delegateCache.size > MAX_DELEGATE_CACHE_SIZE) {
      delegateCache.delete(delegateCache.keys().next().value);
    }
  }

  const result = await request;

  if (rejectUnsuccessful && result.delegate === null) {
    throw result.errorMessage;
  }

  return result.delegate;
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
 * Get every registered delegate in bounded Node pages.
 * @returns {Promise<Object>} Payload with the complete `delegates` list and `totalCount`
 * @throws {string|Error} Node error or an incomplete pagination error
 */
async function getAll() {
  const pageSize = 101;
  const firstPage = await api.getDelegates({ orderBy: 'rate:asc', limit: pageSize, offset: 0 });

  if (!firstPage.success) {
    throw firstPage.errorMessage;
  }

  const totalCount = Number(firstPage.totalCount) || firstPage.delegates.length;
  const offsets = [];

  for (let offset = pageSize; offset < totalCount; offset += pageSize) {
    offsets.push(offset);
  }

  const pages = await Promise.all(
    offsets.map(async (offset) => {
      const response = await api.getDelegates({
        orderBy: 'rate:asc',
        limit: pageSize,
        offset,
      });

      if (!response.success) {
        throw response.errorMessage;
      }

      return response.delegates;
    }),
  );
  const allDelegates = [firstPage.delegates, ...pages].flat();

  if (allDelegates.length !== totalCount) {
    throw new Error(`Expected ${totalCount} delegates, received ${allDelegates.length}`);
  }

  return {
    ...firstPage,
    delegates: allDelegates,
    totalCount,
  };
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
 * Get the next-forger schedule and the block height it was calculated for.
 * @returns {Promise<{delegates: Array<string>, currentBlock: number, currentBlockSlot: number, currentSlot: number, nodeTimestamp: number}>} Schedule snapshot
 * @throws {string} Node error message when the request fails
 */
async function getNextForgersState() {
  const response = await api.getNextForgers(101);

  if (!response.success) {
    throw response.errorMessage;
  }

  return {
    delegates: response.delegates,
    currentBlock: response.currentBlock,
    currentBlockSlot: response.currentBlockSlot,
    currentSlot: response.currentSlot,
    nodeTimestamp: response.nodeTimestamp,
  };
}

/**
 * Get public keys of delegates that will forge next, in forging order.
 * @returns {Promise<Array<string>>} List of delegate public keys
 * @throws {string} Node error message when the request fails
 */
async function getNextForgers() {
  return (await getNextForgersState()).delegates;
}

module.exports = {
  getDelegate,
  getVotes,
  getVoters,
  getForged,
  getActive,
  getAll,
  getStandby,
  getSearch,
  getNextForgers,
  getNextForgersState,
};
