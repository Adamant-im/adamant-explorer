import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const validation = require('../../api/lib/adamant/helpers/validation.js');
const accountsPath = require.resolve('../../api/lib/adamant/requests/accounts.js');
const delegatesPath = require.resolve('../../api/lib/adamant/requests/delegates.js');
const originalAccounts = require.cache[accountsPath];
const originalDelegates = require.cache[delegatesPath];

require.cache[accountsPath] = { exports: {} };
require.cache[delegatesPath] = { exports: {} };
const transactions = require('../../api/lib/adamant/helpers/transactions.js');

if (originalAccounts) {
  require.cache[accountsPath] = originalAccounts;
} else {
  delete require.cache[accountsPath];
}

if (originalDelegates) {
  require.cache[delegatesPath] = originalDelegates;
} else {
  delete require.cache[delegatesPath];
}

describe('API input validation', function () {
  it('validates bounded ADAMANT addresses and uint64 identifiers', function () {
    expect(validation.isAdamantAddress('U765119166770892012')).to.equal(true);
    expect(validation.isAdamantAddress('u765119166770892012')).to.equal(true);
    expect(validation.normalizeAdamantAddress('u765119166770892012')).to.equal(
      'U765119166770892012',
    );
    expect(validation.isAdamantAddress('|765119166770892012')).to.equal(false);
    expect(validation.isAdamantAddress('U18446744073709551616')).to.equal(false);

    expect(validation.isUnsignedIdentifier('18446744073709551615')).to.equal(true);
    expect(validation.isUnsignedIdentifier('18446744073709551616')).to.equal(false);
    expect(validation.isUnsignedIdentifier('01')).to.equal(false);
  });

  it('rejects coercible, duplicate, and out-of-range integer values', function () {
    for (const value of ['12junk', '1e2', '-1', ['12'], { value: '12' }]) {
      expect(() =>
        validation.parseIntegerParameter(value, {
          name: 'offset',
          maximum: 2000,
        }),
      ).to.throw('Missing/Invalid offset parameter');
    }

    expect(() =>
      validation.parseIntegerParameter('2001', {
        name: 'offset',
        maximum: 2000,
      }),
    ).to.throw('Missing/Invalid offset parameter');
  });

  it('enforces route query allowlists and scalar values', function () {
    expect(validation.validateQueryKeys({ address: 'U123456' }, ['address'])).to.equal(null);
    expect(validation.validateQueryKeys({ address: ['U123456', 'U654321'] }, ['address'])).to.equal(
      'Missing/Invalid address parameter',
    );
    expect(validation.validateQueryKeys({ senderId: 'U123456' }, ['address'])).to.equal(
      'Unexpected senderId query parameter',
    );
  });

  it('builds only the address-history query used by the UI', function () {
    expect(
      transactions.normalizeTransactionParams({
        address: 'u765119166770892012',
        offset: '50',
        limit: '51',
        recipientId: 'U111111',
      }),
    ).to.deep.equal({
      orderBy: 'timestamp:desc',
      offset: 50,
      limit: 51,
      and: { recipientId: 'U765119166770892012' },
      or: { senderId: 'U765119166770892012' },
    });

    expect(() =>
      transactions.normalizeTransactionParams({
        senderId: 'U765119166770892012',
      }),
    ).to.throw('Missing/Invalid address parameter');
  });
});
