'use strict';

module.exports = function(config) {
    this.enabled = config.exchangeEnabled;
    this.BTCUSD  = this.XCRBTC = "~";

    this.getBTCUSD = function (cb) {
        if (this.enabled) {
            api.getTicker({ CURR_A: 'btc', CURR_B: 'usd' }, function (err, result) {
                return cb(err, result.avg);
            });
        } else {
            console.log("Loading BTC/USD disabled...");
            return cb(null, "~");
        }
    }

    this.getXCRBTC = function (cb) {
        if (this.enabled) {
            api.getTicker({ CURR_A: 'xcr', CURR_B: 'btc' }, function (err, result) {
                return cb(err, result.avg);
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
                return cb(err);
            } else {
                this.BTCUSD = result;
                console.log("BTC/USD loaded...");
                return cb();
            }
        }.bind(this));
    }

    this.loadXCRBTC = function (cb) {
        console.log("Loading XCR/BTC curs from exchange...");
        this.getXCRBTC(function (err, result) {
            if (err) {
                console.log("Loading BTC/XCR failed...");
                return cb(err);
            } else {
                this.XCRBTC = result;
                console.log("BTC/XCR loaded...");
                return cb();
            }
        }.bind(this));
    }

    this.convertXCRTOUSD = function (xcr) {
        if (this.enabled) {
            return (xcr * this.XCRBTC * this.BTCUSD).toFixed(3);
        } else {
            return "~";
        }
    }

    // Private

    var api = require('./exchange-api');
}
