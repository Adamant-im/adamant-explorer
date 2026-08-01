const logger = require('./log');

// Address book of well-known ADAMANT accounts, loaded from known.json
let addresses = {};

/**
 * Attach known-address info to a transaction.
 *
 * Sets `knownSender` and `knownRecipient` to identity objects when the
 * counterparty is a delegate or a well-known address, or `null` otherwise.
 * @param {Object} tx Transaction body
 * @returns {Object} The same transaction with knowledge fields
 */
function inTx(tx) {
  if (tx.senderUsername) {
    tx.knownSender = { owner: tx.senderUsername, kind: 'delegate' };
  } else {
    tx.knownSender = inAddress(tx.senderId);
  }
  if (tx.senderId === tx.recipientId) {
    tx.recipientUsername = tx.senderUsername;
  }
  if (tx.recipientUsername) {
    tx.knownRecipient = { owner: tx.recipientUsername, kind: 'delegate' };
  } else {
    tx.knownRecipient = inAddress(tx.recipientId);
  }
  return tx;
}

/**
 * Get known-address info for an account.
 * @param {Object} account Account with `username` and `address` fields
 * @returns {Object|null} Identity object when known, `null` otherwise
 */
function inAccount(account) {
  if (account.username) {
    return { owner: account.username, kind: 'delegate' };
  }

  return inAddress(account.address);
}

/**
 * Look an address up in the known-address book.
 * @param {string} address ADAMANT address
 * @returns {Object|null} A copy of the knowledge entry with its semantic kind
 */
function inAddress(address) {
  const entry = addresses[address];

  if (!entry) {
    return null;
  }

  return {
    ...entry,
    kind: entry.description === 'Exchange' ? 'exchange' : 'known',
  };
}

/**
 * Get known-address info for a delegate.
 * @param {Object|null} delegate Delegate body
 * @returns {Object|null} Delegate identity when given, `null` otherwise
 */
function inDelegate(delegate) {
  return delegate ? { owner: delegate.username, kind: 'delegate' } : null;
}

/**
 * Load the known-address book from known.json.
 * Failures are not fatal: the explorer works without knowledge data.
 * @returns {Object} Loaded address book
 */
function load() {
  try {
    logger.debug('Known addresses: Loading known.json');
    addresses = require('../known.json');
  } catch (err) {
    logger.warn(
      `Known addresses: Failed to load known.json; continuing without address labels: ${err.message}`,
    );
    addresses = {};
  }

  logger.info(`Known addresses: Loaded ${Object.keys(addresses).length} address labels`);
  return addresses;
}

load();

module.exports = {
  inTx,
  inAccount,
  inAddress,
  inDelegate,
};
