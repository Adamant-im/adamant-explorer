import { expect } from 'chai';
import statisticsHelpers from '../../api/lib/adamant/helpers/statistics.js';

const { Locator, PeersStatistics } = statisticsHelpers;

describe('PeersStatistics', function () {
  it('classifies peers by the Node state instead of their optional height', async function () {
    const locator = {
      locateIps: async (ips) => new Map(ips.map((ip) => [ip, {}])),
    };
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

  it('restores enriched locations for an immediate post-restart response', async function () {
    const locator = new Locator();
    const location = { hostname: 'node.example', country_code: 'NL' };

    locator.restoreCache([{ ip: '192.0.2.10', location }]);

    expect(await locator.locateIp('192.0.2.10')).to.equal(location);
  });

  it('retries geo lookup for a restored DNS-only location', async function () {
    let lookups = 0;
    const locator = new Locator({
      lookupGeoLocations: async ([ip]) => {
        lookups++;
        return [{ ip, country_code: 'NL' }];
      },
      reverseDns: async () => {
        throw new Error('DNS should not be repeated');
      },
    });

    locator.restoreCache([
      {
        ip: '192.0.2.11',
        location: { hostname: 'restored.example' },
      },
    ]);

    expect(await locator.locateIp('192.0.2.11')).to.deep.equal({
      hostname: 'restored.example',
      ip: '192.0.2.11',
      country_code: 'NL',
    });
    expect(lookups).to.equal(1);
  });

  it('batches uncached geo lookups and reuses normalized locations', async function () {
    const lookupBatches = [];
    const locator = new Locator({
      lookupGeoLocations: async (ips) => {
        lookupBatches.push(ips);
        return ips.map((ip) => ({ ip, country_code: 'NL' }));
      },
      reverseDns: async (ip) => [`host-${ip}.example`],
    });
    const ips = Array.from({ length: 101 }, (_, index) => `192.0.2.${index + 1}`);

    const locations = await locator.locateIps(ips);
    const cached = await locator.locateIp(ips[0]);

    expect(lookupBatches).to.have.length(2);
    expect(lookupBatches[0]).to.have.length(100);
    expect(lookupBatches[1]).to.have.length(1);
    expect(locations.get(ips[0])).to.deep.equal({
      ip: ips[0],
      country_code: 'NL',
      hostname: `host-${ips[0]}.example`,
    });
    expect(cached).to.equal(locations.get(ips[0]));
    expect(lookupBatches).to.have.length(2);
  });

  it('refreshes cached geo data after one day', async function () {
    let now = 0;
    let lookups = 0;
    const locator = new Locator({
      lookupGeoLocations: async ([ip]) => {
        lookups++;
        return [{ ip, country_code: lookups === 1 ? 'NL' : 'DE' }];
      },
      reverseDns: async () => ['node.example'],
      now: () => now,
    });

    expect((await locator.locateIp('192.0.2.15')).country_code).to.equal('NL');

    now = 86400001;

    expect((await locator.locateIp('192.0.2.15')).country_code).to.equal('DE');
    expect(lookups).to.equal(2);
  });

  it('keeps peers usable when geo and reverse-DNS lookups fail', async function () {
    let lookups = 0;
    const locator = new Locator({
      lookupGeoLocations: async () => {
        lookups++;
        throw new Error('Geo service unavailable');
      },
      reverseDns: async () => {
        throw new Error('DNS unavailable');
      },
    });

    expect(await locator.locateIp('192.0.2.20')).to.deep.equal({
      hostname: '192.0.2.20.unknown',
    });
    expect(await locator.locateIp('192.0.2.20')).to.deep.equal({
      hostname: '192.0.2.20.unknown',
    });
    expect(lookups).to.equal(1);
  });

  it('removes stale peer data from every locator cache', function () {
    const locator = new Locator();
    const activeIp = '192.0.2.30';
    const staleIp = '192.0.2.31';

    locator.cache[activeIp] = { country_code: 'NL' };
    locator.cache[staleIp] = { country_code: 'DE' };
    locator.geoLocationExpiresAt[activeIp] = 100;
    locator.geoLocationExpiresAt[staleIp] = 200;
    locator.geoLocationRetryAt[staleIp] = 300;

    locator.updateCache([activeIp]);

    expect(locator.cache).to.have.property(activeIp);
    expect(locator.geoLocationExpiresAt).to.have.property(activeIp, 100);
    expect(locator.cache).not.to.have.property(staleIp);
    expect(locator.geoLocationExpiresAt).not.to.have.property(staleIp);
    expect(locator.geoLocationRetryAt).not.to.have.property(staleIp);
  });
});
