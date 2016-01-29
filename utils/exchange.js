'use strict';

var async = require('async');

module.exports = function (config) {
    this.BTCUSD = this.LISKBTC = '~';

    this.loadRates = function () {
        async.parallel([
            function (cb) { exchange.loadBTCUSD(cb); },
            function (cb) { exchange.loadLISKBTC(cb); }
        ]);
    };

    this.loadBTCUSD = function (cb) {
        console.log('Exchange:', 'Loading BTC/USD curs from exchange...');
        getBTCUSD(function (err, result) {
            if (err) {
                console.log('Exchange:', 'Loading BTC/USD failed...');
                console.log('Error:', err);
            } else if (result !== '~') {
                this.BTCUSD = result;
                console.log('Exchange:', 'BTC/USD loaded...', result);
            }
            if (cb) {
                return cb(err, result);
            }
        }.bind(this));
    };

    this.loadLISKBTC = function (cb) {
        console.log('Exchange:', 'Loading LISK/BTC curs from exchange...');
        getLISKBTC(function (err, result) {
            if (err) {
                console.log('Exchange:', 'Loading BTC/LISK failed...');
                console.log('Error:', err);
            } else if (result !== '~') {
                this.LISKBTC = result;
                console.log('Exchange:', 'BTC/LISK loaded...', result);
            }
            if (cb) {
                return cb(err, result);
            }
        }.bind(this));
    };

    this.LISKUSD = function (lisk) {
        if (lisk && this.LISKBTC !== '~' && this.BTCUSD !== '~') {
            return (parseFloat(lisk) * parseFloat(this.LISKBTC) * parseFloat(this.BTCUSD)).toFixed(3);
        } else {
            return 0;
        }
    };

    // Interval

    if (config.enableExchange) {
        setInterval(this.loadRates, config.updateExchangeInterval);
    }

    // Private

    var exchange = this;
    var api = require('./exchange-api')(config);

    var getBTCUSD = function (cb) {
        if (config.enableExchange) {
            api.getPriceTicker('BTCUSD', function (err, result) {
                return cb(err, result);
            });
        } else {
            console.log('Exchange:', 'Loading BTC/USD disabled...');
            return cb(null, '~');
        }
    };

    var getLISKBTC = function (cb) {
        if (config.enableExchange) {
            api.getPriceTicker('LISKBTC', function (err, result) {
                return cb(err, result);
            });
        } else {
            console.log('Exchange:', 'Loading LISK/BTC disabled...');
            return cb(null, '~');
        }
    };
};
