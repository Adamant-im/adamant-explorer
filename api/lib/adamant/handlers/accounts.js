const accounts = require('../requests/accounts');
const delegates = require('../requests/delegates');
const helpers = require('../helpers/accounts');
const { normalizeAdamantAddress, parseIntegerParameter } = require('../helpers/validation');
const knowledge = require('../../../../utils/knownAddresses');
const logger = require('../../../../utils/log');

const TOP_ACCOUNTS_MAX_OFFSET = 2000;
const TOP_ACCOUNTS_MAX_LIMIT = 100;

/**
 * Get account info
 * @param {Object} params contains address or publicKey
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getAccount(params, error, success) {
  const hasAddress = typeof params?.address === 'string' && params.address.length > 0;
  const hasPublicKey = typeof params?.publicKey === 'string' && params.publicKey.length > 0;

  if (hasAddress === hasPublicKey) {
    return error({
      success: false,
      error: 'Missing/Invalid address or publicKey parameter',
    });
  }

  let lookup;

  if (hasAddress) {
    try {
      lookup = { address: normalizeAdamantAddress(params.address) };
    } catch (err) {
      return error({ success: false, error: err.message });
    }
  } else if (helpers.validatePublicKey(params.publicKey)) {
    lookup = { publicKey: params.publicKey.toLowerCase() };
  } else {
    return error({
      success: false,
      error: 'Missing/Invalid publicKey parameter',
    });
  }

  try {
    let result;

    if (lookup.address) {
      result = await accounts.getAccountByAddress(lookup.address);
    } else {
      result = await accounts.getAccountByPublicKey(lookup.publicKey);
    }

    result.knowledge = knowledge.inAccount(result);

    const [delegate, votes, voters, incomingCount, outgoingCount] = await Promise.all([
      delegates.getDelegate(result.publicKey),
      delegates.getVotes(result.address),
      delegates.getVoters(result.publicKey),
      accounts.getIncomingTxsCnt(result.address),
      accounts.getOutgoingTxsCnt(result.address),
    ]);

    result.delegate = delegate;
    if (result.delegate) {
      result.delegate.forged = await delegates.getForged(result.publicKey);
    }

    result.votes = votes;
    if (result.votes) {
      result.votes = result.votes.map((d) => {
        d.knowledge = knowledge.inAccount(d);
        return d;
      });
    }

    result.voters = voters;
    if (result.voters) {
      result.voters = result.voters.map((d) => {
        d.knowledge = knowledge.inAccount(d);
        return d;
      });
    }

    result.incoming_cnt = incomingCount;
    result.outgoing_cnt = outgoingCount;

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(`Accounts handler: Failed to assemble account details: ${err}`);
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

async function getTopAccounts(query, error, success) {
  let normalizedQuery;

  try {
    normalizedQuery = {
      offset: parseIntegerParameter(query?.offset, {
        name: 'offset',
        defaultValue: 0,
        maximum: TOP_ACCOUNTS_MAX_OFFSET,
      }),
      limit: parseIntegerParameter(query?.limit, {
        name: 'limit',
        defaultValue: TOP_ACCOUNTS_MAX_LIMIT,
        minimum: 1,
        maximum: TOP_ACCOUNTS_MAX_LIMIT,
      }),
    };
  } catch (err) {
    return error({ success: false, error: err.message });
  }

  try {
    const result = {};

    result.accounts = await accounts.getTopAccounts(normalizedQuery);
    result.accounts = result.accounts.map((account) => ({
      // The top-accounts response already carries delegate usernames. Avoid
      // one delegate request per row, which delayed and destabilized this page.
      address: account.address,
      balance: account.balance,
      publicKey: account.publicKey,
      knowledge: knowledge.inAccount(account),
    }));

    result.success = true;

    return success(result);
  } catch (err) {
    logger.warn(
      `Accounts handler: Failed to load top accounts; offset=${normalizedQuery.offset}; limit=${normalizedQuery.limit}: ${err}`,
    );
    return error({
      success: false,
      error: 'Request unsuccessful',
    });
  }
}

module.exports = {
  getAccount,
  getTopAccounts,
};
