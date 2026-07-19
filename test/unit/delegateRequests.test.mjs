import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const apiPath = require.resolve('../../api/lib/adamant/requests/api.js');
const delegatesPath = require.resolve('../../api/lib/adamant/requests/delegates.js');
const originalApi = require.cache[apiPath];
const originalDelegates = require.cache[delegatesPath];
const originalDateNow = Date.now;

describe('delegate request cache', function () {
  afterEach(function () {
    if (originalApi) {
      require.cache[apiPath] = originalApi;
    } else {
      delete require.cache[apiPath];
    }

    if (originalDelegates) {
      require.cache[delegatesPath] = originalDelegates;
    } else {
      delete require.cache[delegatesPath];
    }

    Date.now = originalDateNow;
  });

  it('retries after a rejected lookup expires', async function () {
    let now = 1_000;
    let requests = 0;

    Date.now = () => now;
    require.cache[apiPath] = {
      exports: {
        getDelegate() {
          requests++;

          if (requests === 1) {
            return Promise.reject(new Error('Temporary node failure'));
          }

          return Promise.resolve({
            success: true,
            delegate: { publicKey: 'delegate-key', username: 'delegate' },
          });
        },
      },
    };
    delete require.cache[delegatesPath];

    const delegates = require(delegatesPath);

    expect(await delegates.getDelegate('delegate-key')).to.equal(null);
    expect(await delegates.getDelegate('delegate-key')).to.equal(null);
    expect(requests).to.equal(1);

    now += 60 * 1000 + 1;

    expect(await delegates.getDelegate('delegate-key')).to.deep.equal({
      publicKey: 'delegate-key',
      username: 'delegate',
    });
    expect(requests).to.equal(2);
  });
});
