'use strict';

module.exports = function () {
    function KnownAddresses () {
        this.addresses = {};

        this.inTx = function (tx) {
            tx.knownSender    = this.inAddress(tx.senderId);
            tx.knownRecipient = this.inAddress(tx.recipientId);
            return tx;
        }

        this.inAddress = function (address) {
            return this.addresses[address] || null;
        }

        this.inDelegate = function (delegate) {
            return (delegate) ? { owner : delegate.username } : null;
        }

        this.load = function () {
            try {
                console.log("Loading known addresses...");
                this.addresses = require('../known.json');
            } catch (err) {
                console.error("Error loading known.json:", err.message);
                this.addresses = {};
            }

            var length = Object.keys(this.addresses).length.toString();
            console.log(length, "known addresses loaded");
            return this.addresses;
        }
    }

    return new KnownAddresses();
}
