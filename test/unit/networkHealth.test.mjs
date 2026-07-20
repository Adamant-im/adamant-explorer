import { expect } from 'chai';
import networkHealth from '../../api/lib/adamant/helpers/networkHealth.js';
import { networkHealthStatus } from '../../src/lib/networkHealth.js';

const {
  classifyNetworkHealth,
  countActiveForgingDelegates,
  getNetworkHealthSnapshot,
  mergeForgingHealthBlocks,
} = networkHealth;

describe('network health', function () {
  it('bridges a one-block schedule/cache race with focused REST blocks', function () {
    const cached = [
      { id: 'cached-99', height: 99 },
      { id: 'cached-98', height: 98 },
    ];
    const fresh = [
      { id: 'fresh-100', height: 100 },
      { id: 'fresh-99', height: 99 },
    ];

    expect(mergeForgingHealthBlocks(cached, fresh, 100)).to.deep.equal([
      { id: 'fresh-100', height: 100 },
      { id: 'fresh-99', height: 99 },
      { id: 'cached-98', height: 98 },
    ]);
  });

  it('uses active Delegate Monitor statuses instead of one block round', function () {
    const delegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const roundDelegates = delegates.slice(0, 50);
    const blocks = [
      ...delegates.slice(0, 80).map((generatorPublicKey) => ({
        height: 606,
        generatorPublicKey,
      })),
      ...delegates.slice(80, 100).map((generatorPublicKey) => ({
        height: 303,
        generatorPublicKey,
      })),
      {
        height: 101,
        generatorPublicKey: delegates[100],
      },
    ];

    expect(countActiveForgingDelegates(delegates, blocks, 606, roundDelegates)).to.equal(100);
    expect(countActiveForgingDelegates(delegates.slice(0, 100), blocks, 606, [])).to.equal(null);
  });

  it('maps active forging coverage to live, degraded, and critical states', function () {
    const input = { hasStatus: true, secondsSinceUpdate: 2 };

    expect(networkHealthStatus({ ...input, forgingDelegates: 80 }).label).to.equal('Network live');
    expect(networkHealthStatus({ ...input, forgingDelegates: 51 }).label).to.equal(
      'Network degraded',
    );
    expect(networkHealthStatus({ ...input, forgingDelegates: 50 }).label).to.equal(
      'Network critical',
    );
  });

  it('uses the monitoring thresholds at their exact boundaries', function () {
    expect(classifyNetworkHealth(101)).to.equal('live');
    expect(classifyNetworkHealth(80)).to.equal('live');
    expect(classifyNetworkHealth(79)).to.equal('degraded');
    expect(classifyNetworkHealth(51)).to.equal('degraded');
    expect(classifyNetworkHealth(50)).to.equal('critical');
    expect(classifyNetworkHealth(0)).to.equal('critical');
    expect(() => classifyNetworkHealth(null)).to.throw('Invalid operational delegate count');
  });

  it('builds a coherent request-time height and forging snapshot', async function () {
    const delegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const blocks = delegates.map((generatorPublicKey, index) => ({
      height: 606 - index,
      generatorPublicKey,
    }));
    let statusCalls = 0;

    const snapshot = await getNetworkHealthSnapshot({
      ensureBlocks: async () => {},
      getBlockStatus: async () => {
        statusCalls++;
        return { success: true, height: statusCalls === 1 ? 605 : 606 };
      },
      getCachedBlocks: () => blocks,
      getLatestBlocks: async () => [],
      getNextForgersState: async () => ({ currentBlock: 606 }),
      getForgingSchedule: () => ({ orderedDelegates: delegates }),
      getRoundDelegates: () => [],
    });

    expect(snapshot).to.deep.equal({
      height: 606,
      forgingDelegates: 101,
      activeDelegates: 101,
    });
    expect(statusCalls).to.equal(2);
  });

  it('prioritizes stale and incomplete data', function () {
    expect(
      networkHealthStatus({
        hasStatus: true,
        secondsSinceUpdate: 16,
        forgingDelegates: 90,
      }).label,
    ).to.equal('Updates delayed');
    expect(
      networkHealthStatus({
        hasStatus: true,
        secondsSinceUpdate: 0,
        forgingDelegates: null,
      }).label,
    ).to.equal('Connecting to network');
  });
});
