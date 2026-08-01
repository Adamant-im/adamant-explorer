import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);

describe('ADAMANT API client configuration', function () {
  it('passes the configured debug level and shared logger to the SDK', function () {
    const apiPath = require.resolve('../../api/lib/adamant/requests/api.js');
    const adamantApiPath = require.resolve('adamant-api');
    const configPath = require.resolve('../../modules/configReader.js');
    const loggerPath = require.resolve('../../utils/log.js');
    const paths = [apiPath, adamantApiPath, configPath, loggerPath];
    const originalModules = new Map(
      paths.map((modulePath) => [modulePath, require.cache[modulePath]]),
    );
    const sharedLogger = Object.fromEntries(
      ['error', 'warn', 'info', 'log', 'debug'].map((level) => [level, () => {}]),
    );
    let options;

    class FakeAdamantApi {
      constructor(clientOptions) {
        options = clientOptions;
      }

      onReady(callback) {
        this.readyCallback = callback;
      }
    }

    try {
      delete require.cache[apiPath];
      require.cache[adamantApiPath] = { exports: { AdamantApi: FakeAdamantApi } };
      require.cache[configPath] = {
        exports: {
          nodes_adm: ['https://node.example'],
          log_level: 'debug',
        },
      };
      require.cache[loggerPath] = { exports: sharedLogger };

      require(apiPath);

      expect(options).to.deep.include({
        nodes: ['https://node.example'],
        minVersion: '0.10.2',
        logLevel: 'debug',
      });
      expect(options.logger).to.equal(sharedLogger);
    } finally {
      for (const [modulePath, originalModule] of originalModules) {
        if (originalModule) {
          require.cache[modulePath] = originalModule;
        } else {
          delete require.cache[modulePath];
        }
      }
    }
  });
});
