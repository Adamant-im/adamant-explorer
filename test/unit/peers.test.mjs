import { expect } from 'chai';
import { compareVersionsDescending } from '../../src/lib/peers.js';

describe('peers.js', function () {
  it('sorts dotted versions by numeric segments in descending order', function () {
    const versions = ['0.8.3', '0.10.2', '0.9.0', '0.8.2'];

    expect(versions.sort(compareVersionsDescending)).to.deep.equal([
      '0.10.2',
      '0.9.0',
      '0.8.3',
      '0.8.2',
    ]);
  });
});
