'use strict';

// This is an example for Exchange rates update function

const _ = require('underscore');

module.exports = function (config) {
  this.tickers = {};

  this.loadRates = function () {
    if (!config.exchangeRates.enabled) {
      return false;
    }
    api.getPriceTicker((err, result) => {
      if (result) {
        _.each(result.BTC, (ticker, key) => {
          if (!result.ADM[key]) {
            result.ADM[key] = result.ADM.BTC * ticker;
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

  const api = require('./exchange-api')(config);
  const exchange = this;
};
