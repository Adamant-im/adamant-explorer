import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const exchangePath = require.resolve('../../utils/exchange.js');
const axiosPath = require.resolve('axios');
const loggerPath = require.resolve('../../utils/log.js');

describe('Exchange-rate refresh', function () {
  let originalModules;

  beforeEach(function () {
    originalModules = new Map(
      [exchangePath, axiosPath, loggerPath].map((modulePath) => [
        modulePath,
        require.cache[modulePath],
      ]),
    );
  });

  afterEach(function () {
    for (const [modulePath, originalModule] of originalModules) {
      if (originalModule) {
        require.cache[modulePath] = originalModule;
      } else {
        delete require.cache[modulePath];
      }
    }
  });

  function loadExchange(axiosGet) {
    delete require.cache[exchangePath];
    require.cache[axiosPath] = {
      exports: {
        get: axiosGet,
      },
    };
    require.cache[loggerPath] = {
      exports: {
        debug() {},
        warn() {},
      },
    };

    return require(exchangePath);
  }

  it('does not overlap refreshes when an external source is slow', async function () {
    const pending = [];
    const Exchange = loadExchange(
      () =>
        new Promise((resolve) => {
          pending.push(resolve);
        }),
    );
    const config = {
      exchangeRates: {
        enabled: false,
        updateInterval: 30_000,
      },
    };
    const exchange = new Exchange(config);

    config.exchangeRates.enabled = true;
    const firstRefresh = exchange.loadRates();
    await exchange.loadRates();

    expect(pending).to.have.length(2);

    for (const resolve of pending) {
      resolve({ data: { last: '123.45' } });
    }

    await firstRefresh;
    expect(exchange.tickers).to.deep.equal({
      BTC: {
        USD: 123.45,
        EUR: 123.45,
      },
    });
  });
});
