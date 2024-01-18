const logger = require('./log');

let addresses = {};

function inTx (tx) {
  if (tx.senderUsername) {
    tx.knownSender = {owner: tx.senderUsername};
  } else {
    tx.knownSender = inAddress(tx.senderId);
  }
  if (tx.senderId === tx.recipientId) {
    tx.recipientUsername = tx.senderUsername;
  }
  if (tx.recipientUsername) {
    tx.knownRecipient = {owner: tx.recipientUsername};
  } else {
    tx.knownRecipient = inAddress(tx.recipientId);
  }
  return tx;
}

function inAccount (account) {
  if (account.username) {
    return {owner: account.username};
  } else {
    return inAddress(account.address);
  }
}

function inAddress (address) {
  return addresses[address] || null;
}

function inDelegate (delegate) {
  return (delegate) ? {owner: delegate.username} : null;
}

function load () {
  try {
    logger.info('Known Addresses: ' + 'Loading known addresses...');
    addresses = require('../known.json');
  } catch (err) {
    logger.error('Known Addresses: ' + 'Error loading known.json: ' + err.message);
    addresses = {};
  }

  const length = Object.keys(addresses).length.toString();
  logger.info('Known Addresses: ' + length + ' known addresses loaded');
  return addresses;
}

load();

module.exports = {
  inTx,
  inAccount,
  inAddress,
  inDelegate,
};
