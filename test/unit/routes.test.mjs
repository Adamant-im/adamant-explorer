import { expect } from 'chai';
import { searchResultRoute } from '../../src/lib/routes.js';

describe('frontend route helpers', function () {
  it('maps supported search results to named routes', function () {
    expect(searchResultRoute({ type: 'address', id: 'U123' })).to.deep.equal({
      name: 'address',
      params: { address: 'U123' },
    });
    expect(searchResultRoute({ type: 'block', id: '53748068' })).to.deep.equal({
      name: 'block',
      params: { blockId: '53748068' },
    });
    expect(searchResultRoute({ type: 'tx', id: '1712345678901234567' })).to.deep.equal({
      name: 'transaction',
      params: { txId: '1712345678901234567' },
    });
  });

  it('rejects unknown types and path-altering identifiers', function () {
    for (const result of [
      null,
      { type: 'delegate', id: 'U123' },
      { type: '__proto__', id: '123' },
      { type: 'toString', id: '123' },
      { type: 'tx', id: '../address/U123' },
      { type: 'block', id: '123?redirect=https://example.com' },
      { type: 'address', id: 'U123#fragment' },
      { type: 'address', id: { value: 'U123' } },
    ]) {
      expect(searchResultRoute(result)).to.equal(null);
    }
  });
});
