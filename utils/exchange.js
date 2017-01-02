'use strict';

var async = require('async'),
    _ = require('underscore');

module.exports = function (config) {
    this.tickers = {};

    this.loadRates = function () {
        if (!config.exchnageRates.enabled) {
            return false;
        }
        api.getPriceTicker(function (err, result) {
            if (result) {
                _.each(result.BTC, function (ticker, key) {
                    result.LSK[key] = result.LSK.BTC * ticker;
                });
                this.tickers = result;
            }
        }.bind (this));
    };

    // Interval
    if (config.exchnageRates.enabled) {
        setInterval(this.loadRates, config.exchnageRates.updateInterval);
    }

    // Private
    var api = require('./exchange-api')(config);
};
