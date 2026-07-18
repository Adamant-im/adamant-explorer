const logger = require('./log');

// Address book of well-known ADAMANT accounts, loaded from known.json
let addresses = {};

/**
 * Exchange wallets are intentionally kept as an address set instead of
 * adding metadata to known.json. This preserves the public address-book
 * shape while allowing the UI to distinguish deposits and withdrawals.
 */
const EXCHANGE_ADDRESSES = new Set([
  'U9297769165692482157',
  'U4014868297596277218',
  'U535501431941300255',
  'U5149447931090026688',
  'U13151154215656691634',
  'U11189337096888963052',
  'U8107868892424415199',
  'U5101357317624218301',
  'U18210383484852850087',
  'U7172242865735709555',
  'U2865601723450288885',
  'U11850062950476370884',
  'U4566114185242584837',
  'U6264905194742584837',
  'U5182758014950879510',
  'U9600352766311110750',
  'U14896035773883208990',
  'U1349902942708610281',
  'U8661386084403575057',
  'U13391265038371967188',
  'U12154214274606185882',
  'U13552275059481832440',
  'U4303970200685919308',
  'U14209493970755488723',
  'U14409764399342362497',
  'U13068387843550910698',
  'U6423399539021809352',
  'U10181109575158506339',
  'U5945759447329460822',
  'U4238546078217566409',
]);

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
    kind: EXCHANGE_ADDRESSES.has(address) ? 'exchange' : 'known',
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
  EXCHANGE_ADDRESSES,
  inTx,
  inAccount,
  inAddress,
  inDelegate,
};
