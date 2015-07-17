'use strict';

module.exports = function (config) {
    this.BTCUSD = this.XCRBTC = '~';

    this.loadRates = function () {
        async.parallel([
            function (cb) { exchange.loadBTCUSD(cb) },
            function (cb) { exchange.loadXCRBTC(cb) }
        ]);
    }

    this.loadBTCUSD = function (cb) {
        console.log('Loading BTC/USD curs from exchange...');
        getBTCUSD(function (err, result) {
            if (err) {
                console.log('Loading BTC/USD failed...');
                console.log('Error:', err);
            } else if (result != '~') {
                this.BTCUSD = result;
                console.log('BTC/USD loaded...', result);
            }
            if (cb) {
                return cb(err, result);
            }
        }.bind(this));
    }

    this.loadXCRBTC = function (cb) {
        console.log('Loading XCR/BTC curs from exchange...');
        getXCRBTC(function (err, result) {
            if (err) {
                console.log('Loading BTC/XCR failed...');
                console.log('Error:', err);
            } else if (result != '~') {
                this.XCRBTC = result;
                console.log('BTC/XCR loaded...', result);
            }
            if (cb) {
                return cb(err, result);
            }
        }.bind(this));
    }

    this.convertXCRTOUSD = function (xcr) {
        if (!isNaN(xcr)) {
            return (xcr * this.XCRBTC * this.BTCUSD).toFixed(3);
        } else {
            return '~';
        }
    }

    // Interval

    if (config.enableExchange) {
        setInterval(this.loadRates, config.updateExchangeInterval);
    }

    // Private

    var exchange = this;
    var api = require('./exchange-api')(config);

    var getBTCUSD = function (cb) {
        if (config.enableExchange) {
            api.getTicker('BTCUSD', function (err, result) {
                return cb(err, result);
            });
        } else {
            console.log('Loading BTC/USD disabled...');
            return cb(null, '~');
        }
    }

    var getXCRBTC = function (cb) {
        if (config.enableExchange) {
            api.getTicker('XCRBTC', function (err, result) {
                return cb(err, result);
            });
        } else {
            console.log('Loading XCR/BTC disabled...');
            return cb(null, '~');
        }
    }
}
