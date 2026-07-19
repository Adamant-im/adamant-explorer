'use strict';

const axios = require('axios');
const logger = require('./log');

const REQUEST_TIMEOUT = 10000;

/**
 * Public ticker sources that require no API key.
 * Each `parse` callback extracts the last trade price from the source response.
 *
 * ADM rates are not fetched yet: they will be provided by the ADAMANT
 * currencyinfo service (https://github.com/Adamant-im/currencyinfo),
 * which is tracked as a separate issue.
 */
const SOURCES = [
  {
    base: 'BTC',
    quote: 'USD',
    name: 'Bitstamp',
    url: 'https://www.bitstamp.net/api/v2/ticker/btcusd/',
    parse: (data) => Number(data.last),
  },
  {
    base: 'BTC',
    quote: 'EUR',
    name: 'Bitstamp',
    url: 'https://www.bitstamp.net/api/v2/ticker/btceur/',
    parse: (data) => Number(data.last),
  },
];

/**
 * Exchange rates service.
 *
 * When enabled in the config, periodically fetches tickers from public
 * sources and keeps the latest known rates in `tickers`, grouped as
 * `tickers[base][quote]`, e.g. `tickers.BTC.USD`.
 */
class Exchange {
  /**
   * @param {Object} config Explorer configuration with an `exchangeRates` section
   */
  constructor(config) {
    this.config = config;

    /** @type {Object<string, Object<string, number>>} Latest known rates */
    this.tickers = {};
    this.isLoading = false;

    if (config.exchangeRates.enabled) {
      setInterval(() => this.loadRates(), config.exchangeRates.updateInterval);
      logger.debug(
        `Exchange rates: Enabled; sources=${SOURCES.length}; refreshInterval=${config.exchangeRates.updateInterval}ms`,
      );
    } else {
      logger.debug('Exchange rates: Disabled by configuration');
    }
  }

  /**
   * Fetch all tickers and replace `tickers` with fresh values.
   *
   * Failed sources are logged and skipped; the previous rates are kept
   * when every source fails. Never rejects.
   * @returns {Promise<void>}
   */
  async loadRates() {
    if (!this.config.exchangeRates.enabled || this.isLoading) {
      return;
    }

    this.isLoading = true;
    const tickers = {};

    try {
      await Promise.all(
        SOURCES.map(async ({ base, quote, name, url, parse }) => {
          try {
            const { data } = await axios.get(url, { timeout: REQUEST_TIMEOUT });
            const rate = parse(data);

            if (Number.isFinite(rate) && rate > 0) {
              tickers[base] = { ...tickers[base], [quote]: rate };
            } else {
              logger.warn(
                `Exchange rates: ${name} returned an invalid ${base}/${quote} rate; source skipped`,
              );
            }
          } catch (error) {
            logger.warn(
              `Exchange rates: Failed to fetch ${base}/${quote} from ${name} within ${REQUEST_TIMEOUT}ms; source skipped: ${error.message}`,
            );
          }
        }),
      );

      if (Object.keys(tickers).length > 0) {
        this.tickers = tickers;
        const pairCount = Object.values(tickers).reduce(
          (count, quotes) => count + Object.keys(quotes).length,
          0,
        );
        logger.debug(`Exchange rates: Refreshed ${pairCount} ticker pairs`);
      } else {
        logger.warn('Exchange rates: No source returned a usable ticker; keeping previous rates');
      }
    } finally {
      this.isLoading = false;
    }
  }
}

module.exports = Exchange;
