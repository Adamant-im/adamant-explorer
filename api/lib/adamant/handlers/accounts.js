const accounts = require('../requests/accounts');
const delegates = require('../requests/delegates');
const helpers = require('../helpers/accounts');
const knowledge = require('../../../../utils/knownAddresses');
const logger = require('../../../../utils/log');

/**
 * Get account info
 * @param {Object} params contains address or publicKey
 * @param {Function} error
 * @param {Function} success
 * @returns {Promise<*>}
 */
async function getAccount(params, error, success) {
  try {
    if (params.address && !helpers.validateAddress(params.address)) {
      return error({
        success: false,
        error: 'Missing/Invalid address parameter',
      });
    }

    if (params.publicKey && !helpers.validatePublicKey(params.publicKey)) {
      return error({
        success: false,
        error: 'Missing/Invalid publicKey parameter',
      });
    }

    let result;

    if (params.address) {
      result = await accounts.getAccountByAddress(params.address);
    } else if (params.publicKey) {
      result = await accounts.getAccountByPublicKey(params.publicKey);
    } else {
      return error({
        success: false,
        error: 'Missing/Invalid address or publicKey parameter',
      });
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
  try {
    const result = {};

    query.offset = helpers.param(query.offset, 0);
    query.limit = helpers.param(query.limit, 100);
    if (query.limit === 0) {
      query.limit = 100;
    }

    result.accounts = await accounts.getTopAccounts(query);
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
      `Accounts handler: Failed to load top accounts; offset=${query.offset}; limit=${query.limit}: ${err}`,
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
