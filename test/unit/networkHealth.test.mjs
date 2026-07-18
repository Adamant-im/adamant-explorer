import { expect } from 'chai';
import networkHealth from '../../api/lib/adamant/helpers/networkHealth.js';
import { networkHealthStatus } from '../../src/lib/networkHealth.js';

const { countActiveForgingDelegates } = networkHealth;

describe('network health', function () {
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
