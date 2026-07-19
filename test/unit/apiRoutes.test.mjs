import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const { SUPPORTED_API_PATHS } = require('../../api/lib/adamant/helpers/http.js');

describe('Explorer API route surface', function () {
  it('registers only the UI routes and the operational health endpoint', function () {
    const handlerPaths = [
      'accounts',
      'blocks',
      'common',
      'delegates',
      'networkHealth',
      'transactions',
    ].map((name) => require.resolve(`../../api/lib/adamant/handlers/${name}.js`));
    const routePaths = [
      'accounts',
      'blocks',
      'common',
      'delegates',
      'index',
      'networkHealth',
      'transactions',
    ].map((name) => require.resolve(`../../api/routes/${name}.js`));
    const originals = new Map(
      [...handlerPaths, ...routePaths].map((modulePath) => [modulePath, require.cache[modulePath]]),
    );

    try {
      for (const modulePath of handlerPaths) {
        require.cache[modulePath] = {
          exports: {
            getNetworkHealth() {},
          },
        };
      }

      for (const modulePath of routePaths) {
        delete require.cache[modulePath];
      }

      const registered = [];
      const app = {
        get(path, ...handlers) {
          registered.push({ path, handlers });
        },
      };

      require('../../api/routes/index.js')(app);

      expect(registered.map(({ path }) => path)).to.have.members(SUPPORTED_API_PATHS);
      expect(registered).to.have.length(SUPPORTED_API_PATHS.length);
      expect(registered.every(({ handlers }) => handlers.length === 2)).to.equal(true);
    } finally {
      for (const [modulePath, original] of originals) {
        if (original) {
          require.cache[modulePath] = original;
        } else {
          delete require.cache[modulePath];
        }
      }
    }
  });
});
