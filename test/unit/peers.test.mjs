import { expect } from 'chai';
import { compareVersionsDescending, groupPeerHeights } from '../../src/lib/peers.js';

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

  describe('groupPeerHeights()', function () {
    it('treats three adjacent heights as the current best height', function () {
      expect(groupPeerHeights([53733846, 53733845, 53733844, 53733843]).groups).to.deep.equal([
        { height: 53733846, count: 3, percent: 75 },
        { height: 53733843, count: 1, percent: 25 },
      ]);
    });

    it('collapses every lagging band when at least 90% are synchronized', function () {
      const result = groupPeerHeights([
        ...Array(88).fill(53733846),
        ...Array(2).fill(53733845),
        ...Array(10).fill(53733840),
      ]);

      expect(result.groups).to.deep.equal([{ height: 53733846, count: 90, percent: 90 }]);
      expect(result.otherCount).to.equal(10);
      expect(result.otherPercent).to.equal(10);
    });
  });
});
