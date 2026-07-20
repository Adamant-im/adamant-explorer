import { expect } from 'chai';
import {
  compareVersionsDescending,
  groupPeerHeights,
  peerCoordinates,
  peerFlagClass,
  peerPlatformName,
  peerPopupRows,
  peerStateClass,
} from '../../src/lib/peers.js';

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

  describe('peer presentation hardening', function () {
    it('allowlists CSS class fragments from peer and geo payloads', function () {
      expect(peerPlatformName('Linux')).to.equal('linux');
      expect(peerPlatformName('linux hidden')).to.equal('unknown');
      expect(peerFlagClass(' NL ')).to.equal('flag-nl');
      expect(peerFlagClass('nl hidden')).to.equal('');
      expect(peerStateClass(2)).to.equal('state-2');
      expect(peerStateClass('2 hidden')).to.equal('state-unknown');
    });

    it('accepts only finite, in-range map coordinates', function () {
      expect(peerCoordinates({ location: { latitude: 52.37, longitude: 4.9 } })).to.deep.equal([
        52.37, 4.9,
      ]);
      expect(peerCoordinates({ location: { latitude: 91, longitude: 4.9 } })).to.equal(null);
      expect(peerCoordinates({ location: { latitude: 52.37, longitude: '4.9' } })).to.equal(null);
      expect(peerCoordinates({ location: { latitude: Number.NaN, longitude: 4.9 } })).to.equal(
        null,
      );
    });

    it('keeps popup payloads as plain text and omits structured values', function () {
      const rows = peerPopupRows({
        ip: '127.0.0.1<img src=x onerror=alert(1)>',
        version: { toString: 'not invoked' },
        os: 'linux<script>alert(1)</script>',
        location: {
          hostname: '<b>peer.example</b>',
          country_name: 42,
        },
      });

      expect(rows).to.deep.equal([
        {
          label: '',
          value: '127.0.0.1<img src=x onerror=alert(1)>',
          className: 'ip',
        },
        { label: 'Hostname', value: '<b>peer.example</b>' },
        { label: 'OS', value: 'linux<script>alert(1)</script>' },
        { label: 'Country', value: '42' },
      ]);
    });
  });
});
