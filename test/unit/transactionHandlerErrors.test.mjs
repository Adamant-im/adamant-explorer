import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const handlerPath = require.resolve('../../api/lib/adamant/handlers/transactions.js');
const requestsPath = require.resolve('../../api/lib/adamant/requests/transactions.js');
const helpersPath = require.resolve('../../api/lib/adamant/helpers/transactions.js');
const knowledgePath = require.resolve('../../utils/knownAddresses.js');
const loggerPath = require.resolve('../../utils/log.js');
const validation = require('../../api/lib/adamant/helpers/validation.js');

describe('transaction handler error boundaries', function () {
  let originalModules;

  beforeEach(function () {
    originalModules = new Map(
      [handlerPath, requestsPath, helpersPath, knowledgePath, loggerPath].map((modulePath) => [
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

  function loadHandler(helpers) {
    require.cache[requestsPath] = {
      exports: {
        async getTransactions() {
          return [{}];
        },
      },
    };
    require.cache[helpersPath] = { exports: helpers };
    require.cache[knowledgePath] = { exports: {} };
    require.cache[loggerPath] = {
      exports: {
        warn() {},
      },
    };
    delete require.cache[handlerPath];

    return require(handlerPath);
  }

  async function run(handler) {
    let result;

    await handler.getTransactionsByAddress(
      {},
      (data) => {
        result = data;
      },
      () => {
        throw new Error('unexpected success');
      },
    );

    return result;
  }

  it('returns explicit public validation errors', async function () {
    const handler = loadHandler({
      normalizeTransactionParams() {
        throw new validation.ValidationError('Missing/Invalid address parameter');
      },
    });

    expect(await run(handler)).to.deep.equal({
      success: false,
      error: 'Missing/Invalid address parameter',
    });
  });

  it('does not expose an internal TypeError message', async function () {
    const handler = loadHandler({
      normalizeTransactionParams() {
        return {};
      },
      async processTransaction() {
        throw new TypeError('sensitive internal implementation detail');
      },
    });

    expect(await run(handler)).to.deep.equal({
      success: false,
      error: 'Request unsuccessful',
    });
  });
});
