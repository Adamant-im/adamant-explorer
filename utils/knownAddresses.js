'use strict';
const logger = require('./log');

module.exports = function () {
  function KnownAddresses() {
    this.addresses = {};

    this.inTx = function (tx) {
      if (tx.senderUsername) {
        tx.knownSender = {owner: tx.senderUsername};
      } else {
        tx.knownSender = self.inAddress(tx.senderId);
      }
      if (tx.senderId === tx.recipientId) {
        tx.recipientUsername = tx.senderUsername;
      }
      if (tx.recipientUsername) {
        tx.knownRecipient = {owner: tx.recipientUsername};
      } else {
        tx.knownRecipient = self.inAddress(tx.recipientId);
      }
      return tx;
    };

    this.inAccount = function (account) {
      if (account.username) {
        return {owner: account.username};
      } else {
        return self.inAddress(account.address);
      }
    };

    this.inAddress = function (address) {
      return self.addresses[address] || null;
    };

    this.inDelegate = function (delegate) {
      return (delegate) ? {owner: delegate.username} : null;
    };

    this.load = function () {
      try {
        logger.info('Known Addresses: ' + 'Loading known addresses...');
        self.addresses = require('../known.json');
      } catch (err) {
        logger.error('Known Addresses: ' + 'Error loading known.json:' + err.message);
        self.addresses = {};
      }

      const length = Object.keys(self.addresses).length.toString();
      logger.info('Known Addresses: ' + length + 'known addresses loaded');
      return self.addresses;
    };

    // Private

    const self = this;

    this.load(); // Load on initialization
  }

  return new KnownAddresses();
};
