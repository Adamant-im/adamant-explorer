'use strict';

var config = {};
config.lisk = {};
config.freegeoip = {};
config.redis = {};
config.proposals = {};
config.log = {};
config.exchangeRates = {exchanges: { LSK: {}, BTC: {}}};
config.marketWatcher = {exchanges: {}, candles: { poloniex: {} }, orders: {}};

module.exports = config;
