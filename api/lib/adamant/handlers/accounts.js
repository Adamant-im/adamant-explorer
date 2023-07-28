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

    result.delegate = await delegates.getDelegate(result.publicKey);

    if (result.delegate) {
      result.delegate.forged = await delegates.getForged(result.publicKey);
    }

    result.votes = await delegates.getVotes(result.address);
    if (result.votes) {
      result.votes = result.votes.map((d) => {
        d.knowledge = knowledge.inAccount(d);
        return d;
      });
    }

    result.voters = await delegates.getVoters(result.publicKey);
    if (result.voters) {
      result.voters = result.voters.map((d) => {
        d.knowledge = knowledge.inAccount(d);
        return d;
      });
    }

    result.incoming_cnt = await accounts.getIncomingTxsCnt(result.address);

    result.outgoing_cnt = await accounts.getOutgoingTxsCnt(result.address);

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
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

    result.accounts = await accounts.getTopAccounts(query);
    result.accounts = await Promise.all(result.accounts.map(async (account) => {
      const accountKnowledge = knowledge.inAccount(account);

      if (!accountKnowledge && account.publicKey) {
        account.knowledge = await delegates.getDelegate(account.publicKey);
        account.knowledge = knowledge.inDelegate(account.knowledge);
      } else {
        account.knowledge = accountKnowledge;
      }

      return account;
    }));

    result.success = true;

    return success(result);
  } catch (err) {
    logger.error(err);
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
