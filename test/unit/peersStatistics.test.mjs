import { expect } from 'chai';
import statisticsHelpers from '../../api/lib/adamant/helpers/statistics.js';

const { PeersStatistics } = statisticsHelpers;

describe('PeersStatistics', function () {
  it('classifies peers by the Node state instead of their optional height', async function () {
    const locator = { locateIp: async () => ({}) };
    const statistics = new PeersStatistics(locator);

    await statistics.collect([
      { ip: '192.0.2.1', port: 36666, state: 2, height: null, os: 'linux' },
      { ip: '192.0.2.2', port: 36666, state: 1, height: 100, os: 'linux' },
      { ip: '192.0.2.3', port: 36666, state: 0, height: 100, os: 'linux' },
    ]);

    expect(statistics.list.connected.map((peer) => peer.ip)).to.include('192.0.2.1');
    expect(statistics.list.disconnected.map((peer) => peer.ip)).to.include.members([
      '192.0.2.2',
      '192.0.2.3',
    ]);
    expect(
      statistics.list.disconnected.find((peer) => peer.ip === '192.0.2.3').humanState,
    ).to.equal('Banned');
  });
});
