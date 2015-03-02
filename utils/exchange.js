'use strict';

module.exports = function(config) {
    this.BTCUSD = this.XCRBTC = "~";

    if (config.enableExchange) {
        setInterval(function () {
            this.loadBTCUSD();
            this.loadXCRBTC();
        }.bind(this), config.updateExchangeInterval);
    }

    this.getBTCUSD = function (cb) {
        if (config.enableExchange) {
            api.getTicker('BTCUSD', function (err, result) {
                return cb(err, result);
            });
        } else {
            console.log("Loading BTC/USD disabled...");
            return cb(null, "~");
        }
    }

    this.getXCRBTC = function (cb) {
        if (config.enableExchange) {
            api.getTicker('XCRBTC', function (err, result) {
                return cb(err, result);
            });
        } else {
            console.log("Loading XCR/BTC disabled...");
            return cb(null, "~");
        }
    }

    this.loadBTCUSD = function (cb) {
        console.log("Loading BTC/USD curs from exchange...");
        this.getBTCUSD(function (err, result) {
            if (err) {
                console.log("Loading BTC/USD failed...");
                console.log("Error:", err);
                return cb(err);
            } else if (result != '~') {
                this.BTCUSD = result;
                console.log("BTC/USD loaded...", result);
                return cb();
            } else {
                return cb();
            }
        }.bind(this));
    }

    this.loadXCRBTC = function (cb) {
        console.log("Loading XCR/BTC curs from exchange...");
        this.getXCRBTC(function (err, result) {
            if (err) {
                console.log("Loading BTC/XCR failed...");
                console.log("Error:", err);
                return cb(err);
            } else if (result != '~') {
                this.XCRBTC = result;
                console.log("BTC/XCR loaded...", result);
                return cb();
            } else {
                return cb();
            }
        }.bind(this));
    }

    this.convertXCRTOUSD = function (xcr) {
        if (!isNaN(xcr)) {
            return (xcr * this.XCRBTC * this.BTCUSD).toFixed(3);
        } else {
            return "~";
        }
    }

    // Private

    var api = require('./exchange-api')(config);
}
