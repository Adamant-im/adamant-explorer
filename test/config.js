'use strict';

var config = require('./config.global');

// CONFIGURATION
// =======================================================================================

config.host = '0.0.0.0'; // Interface to listen on, 0.0.0.0 to listen on all available
config.port = 6040;      // Port to listen on

// LISK node
config.lisk.host = '127.0.0.1';
config.lisk.port = 7000;

// FreeGeoIP server
config.freegeoip.host = '127.0.0.1';
config.freegeoip.port = 8080;

// Redis server
config.redis.host     = '127.0.0.1';
config.redis.port     = 6379;
config.redis.password = '';

// Header price tickers, Currency switcher
config.exchangeRates.enabled = true;         // Exchange rates support (true - enabled, false - disabled)
config.exchangeRates.updateInterval = 30000; // Interval in ms for checking exchange rates (default: 30 seconds)
// Configuration for different currency pairs, set false to disable pair
config.exchangeRates.exchanges.LSK.BTC = 'poloniex'; // LSK/BTC pair, supported: poloniex
config.exchangeRates.exchanges.LSK.CNY = 'jubi';     // LSK/CNY pair, supported: jubi, bitbays
config.exchangeRates.exchanges.BTC.USD = 'bitfinex'; // BTC/USD pair, supported: bitfinex, bitstamp, btce
config.exchangeRates.exchanges.BTC.EUR = 'bitstamp'; // BTC/EUR pair, supported: bitstamp, bitmarket
config.exchangeRates.exchanges.BTC.PLN = false;      // BTC/PLN pair, supported: bitmarket

config.cacheTTL = 20; // Time in seconds to store cache in Redis

// Market watcher
config.enableCandles = true;          // Automatic update of candlestick data (true - enabled, false - disabled)
config.updateCandlesInterval = 30000; // Interval in ms for updating candlestick data (default: 30 seconds)
config.enableOrders = true;           // Automatic update of order book data (true - enabled, false - disabled)
config.updateOrdersInterval = 15000;  // Interval in ms for updating order book data (default: 15 seconds)

// =======================================================================================

module.exports = config;
