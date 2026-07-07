const logger = require('./log');

// Address book of well-known ADAMANT accounts, loaded from known.json
let addresses = {};

/**
 * Attach known-address info to a transaction.
 *
 * Sets `knownSender` and `knownRecipient` to `{owner}` objects when the
 * counterparty is a delegate or a well-known address, or `null` otherwise.
 * @param {Object} tx Transaction body
 * @returns {Object} The same transaction with knowledge fields
 */
function inTx(tx) {
  if (tx.senderUsername) {
    tx.knownSender = { owner: tx.senderUsername };
  } else {
    tx.knownSender = inAddress(tx.senderId);
  }
  if (tx.senderId === tx.recipientId) {
    tx.recipientUsername = tx.senderUsername;
  }
  if (tx.recipientUsername) {
    tx.knownRecipient = { owner: tx.recipientUsername };
  } else {
    tx.knownRecipient = inAddress(tx.recipientId);
  }
  return tx;
}

/**
 * Get known-address info for an account.
 * @param {Object} account Account with `username` and `address` fields
 * @returns {Object|null} `{owner}` when known, `null` otherwise
 */
function inAccount(account) {
  if (account.username) {
    return { owner: account.username };
  }

  return inAddress(account.address);
}

/**
 * Look an address up in the known-address book.
 * @param {string} address ADAMANT address
 * @returns {Object|null} Knowledge entry when known, `null` otherwise
 */
function inAddress(address) {
  return addresses[address] || null;
}

/**
 * Get known-address info for a delegate.
 * @param {Object|null} delegate Delegate body
 * @returns {Object|null} `{owner}` when a delegate is given, `null` otherwise
 */
function inDelegate(delegate) {
  return delegate ? { owner: delegate.username } : null;
}

/**
 * Load the known-address book from known.json.
 * Failures are not fatal: the explorer works without knowledge data.
 * @returns {Object} Loaded address book
 */
function load() {
  try {
    logger.info('Known Addresses: Loading known addresses...');
    addresses = require('../known.json');
  } catch (err) {
    logger.error(`Known Addresses: Failed to load known.json: ${err.message}`);
    addresses = {};
  }

  logger.info(`Known Addresses: ${Object.keys(addresses).length} known addresses loaded`);
  return addresses;
}

load();

module.exports = {
  inTx,
  inAccount,
  inAddress,
  inDelegate,
};
