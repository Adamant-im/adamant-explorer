'use strict';

module.exports = function () {
    function KnownAddresses () {
        this.addresses = {};

        this.inTx = function (tx) {
            if (tx.senderUsername) {
                tx.knownSender = { owner : tx.senderUsername };
            } else {
                tx.knownSender = this.inAddress(tx.senderId);
            }
            if (tx.recipientUsername) {
                tx.knownRecipient = { owner : tx.recipientUsername };
            } else {
                tx.knownRecipient = this.inAddress(tx.recipientId);
            }
            return tx;
        };

        this.inAccount = function (account) {
            if (account.username) {
                return { owner : account.username };
            } else {
                return this.inAddress(account.address);
            }
        };

        this.inAddress = function (address) {
            return this.addresses[address] || null;
        };

        this.inDelegate = function (delegate) {
            return (delegate) ? { owner : delegate.username } : null;
        };

        this.load = function () {
            try {
                console.log('KnownAddresses:', 'Loading known addresses...');
                this.addresses = require('../known.json');
            } catch (err) {
                console.error('KnownAddresses:', 'Error loading known.json:', err.message);
                this.addresses = {};
            }

            var length = Object.keys(this.addresses).length.toString();
            console.log('KnownAddresses:', length, 'known addresses loaded');
            return this.addresses;
        };

        this.load(); // Load on initialization
    }

    return new KnownAddresses();
};
