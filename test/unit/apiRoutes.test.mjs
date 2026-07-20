import { createRequire } from 'node:module';
import { expect } from 'chai';
import { SUPPORTED_API_PATHS } from '../../api/lib/adamant/constants.mjs';

const require = createRequire(import.meta.url);

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

  it('passes successful top-account responses to the shared cache store path', function () {
    const handlerPath = require.resolve('../../api/lib/adamant/handlers/accounts.js');
    const routePath = require.resolve('../../api/routes/accounts.js');
    const originalHandler = require.cache[handlerPath];
    const originalRoute = require.cache[routePath];

    try {
      const response = { success: true, accounts: [] };
      require.cache[handlerPath] = {
        exports: {
          getAccount() {},
          getTopAccounts(query, error, success) {
            success(response);
          },
        },
      };
      delete require.cache[routePath];

      const registered = [];
      const app = {
        get(path, ...handlers) {
          registered.push({ path, handlers });
        },
      };

      require(routePath)(app);

      const route = registered.find(({ path }) => path === '/api/getTopAccounts');
      const req = { query: {} };
      const res = {
        json() {
          throw new Error('successful response bypassed the cache store');
        },
      };
      let continued = false;

      route.handlers.at(-1)(req, res, () => {
        continued = true;
      });

      expect(req.json).to.equal(response);
      expect(continued).to.equal(true);
    } finally {
      if (originalHandler) {
        require.cache[handlerPath] = originalHandler;
      } else {
        delete require.cache[handlerPath];
      }

      if (originalRoute) {
        require.cache[routePath] = originalRoute;
      } else {
        delete require.cache[routePath];
      }
    }
  });
});
