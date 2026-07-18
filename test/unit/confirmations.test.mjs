import { expect } from 'chai';
import { liveConfirmations } from '../../src/lib/confirmations.js';

describe('confirmations.js', function () {
  it('calculates confirmations from live network height', function () {
    expect(liveConfirmations(100, 105, 1)).to.equal(6);
  });

  it('keeps the API fallback without usable heights', function () {
    expect(liveConfirmations(undefined, 105, 7)).to.equal(7);
    expect(liveConfirmations(0, 105, 0)).to.equal(0);
  });
});
