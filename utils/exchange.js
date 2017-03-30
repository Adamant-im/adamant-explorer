'use strict';

var async = require('async'),
    _ = require('underscore');

module.exports = function (config) {
    this.tickers = {};

    this.loadRates = function () {
        if (!config.exchangeRates.enabled) {
            return false;
        }
        api.getPriceTicker(function (err, result) {
            if (result) {
                _.each(result.BTC, function (ticker, key) {
                    if (!result.LSK[key]) {
                        result.LSK[key] = result.LSK.BTC * ticker;
                    }
                });
                exchange.tickers = result;
            }
        });
    };

    // Interval

    if (config.exchangeRates.enabled) {
        setInterval(this.loadRates, config.exchangeRates.updateInterval);
    }

    // Private

    var api = require('./exchange-api')(config),
        exchange = this;
};
