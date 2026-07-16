import { expect } from 'chai';
import {
  forgingStatus,
  forgingTotals,
  forgingProgress,
  totalBlockRewards,
} from '../../src/lib/forging.js';

// Unit tests for the Delegate Monitor forging status logic.

/**
 * Builds a delegate whose last block sits in the given round.
 * @param {number} lastBlockHeight Height of the last forged block
 * @param {boolean} isRoundDelegate Whether the delegate is in the current round list
 * @returns {Object} Minimal delegate object for forgingStatus()
 */
function delegateWithBlockAt(lastBlockHeight, isRoundDelegate, historyRoundCount = 5) {
  return {
    blocksAt: '2026-01-01T00:00:00Z',
    blocks: [{ height: lastBlockHeight, timestamp: 1000 }],
    isRoundDelegate,
    historyRoundCount,
  };
}

describe('forging.js', function () {
  describe('forgingStatus()', function () {
    it('reports code 0 for a block forged in the current round', function () {
      // Height 150 and 160 are both round 2
      const status = forgingStatus(delegateWithBlockAt(150, true), 160);
      expect(status.code).to.equal(0);
    });

    it('reports code 3 when awaiting slot after forging last round', function () {
      // Block in round 1, network in round 2, still a round delegate
      const status = forgingStatus(delegateWithBlockAt(50, true), 160);
      expect(status.code).to.equal(3);
    });

    it('reports code 1 for a missed block in the current round', function () {
      const status = forgingStatus(delegateWithBlockAt(50, false), 160);
      expect(status.code).to.equal(1);
    });

    it('keeps three completed missed slots yellow', function () {
      const status = forgingStatus(delegateWithBlockAt(50, false), 400);
      expect(status.code).to.equal(1);
      expect(status.missedRounds).to.equal(3);
    });

    it('reports code 2 after four completed missed slots', function () {
      const status = forgingStatus(delegateWithBlockAt(50, false), 450);
      expect(status.code).to.equal(2);
      expect(status.missedRounds).to.equal(4);
    });

    it('reports code 5 when no data is available yet', function () {
      const status = forgingStatus({ blocks: [], isRoundDelegate: true }, 160);
      expect(status.code).to.equal(5);
    });

    it('reports code 5 while fewer than five rounds are known', function () {
      const status = forgingStatus(
        {
          blocksAt: '2026-01-01T00:00:00Z',
          blocks: [],
          isRoundDelegate: true,
          historyRoundCount: 4,
        },
        160,
      );
      expect(status.code).to.equal(5);
      expect(status.reason).to.equal('insufficient-history');
    });

    it('reports code 2 after five observed rounds without a block', function () {
      const status = forgingStatus(
        {
          blocksAt: '2026-01-01T00:00:00Z',
          blocks: [],
          isRoundDelegate: true,
          historyRoundCount: 5,
        },
        160,
      );
      expect(status.code).to.equal(2);
    });

    it('keeps a delegate grey when it has not entered the active schedule', function () {
      const status = forgingStatus(
        {
          blocksAt: '2026-01-01T00:00:00Z',
          blocks: [],
          isRoundDelegate: false,
          historyRoundCount: 0,
        },
        160,
      );
      expect(status.code).to.equal(5);
    });
  });

  describe('forgingTotals()', function () {
    it('buckets delegates by status code', function () {
      const delegates = [0, 1, 2, 3, 4, 5].map((code) => ({
        forgingStatus: { code },
        isRoundDelegate: code === 3 || code === 4,
      }));
      const totals = forgingTotals(delegates);

      expect(totals.forging).to.equal(2); // codes 0 and 3
      expect(totals.missedBlock).to.equal(2); // codes 1 and 4
      expect(totals.notForging).to.equal(1); // code 2
      expect(totals.awaitingSlot).to.equal(2); // codes 3 and 4
      expect(totals.unprocessed).to.equal(1); // code 5
    });

    it('keeps a not-forging delegate in the awaiting count while its slot is ahead', function () {
      const totals = forgingTotals([
        {
          forgingStatus: { code: 2 },
          isRoundDelegate: true,
        },
      ]);

      expect(totals.notForging).to.equal(1);
      expect(totals.awaitingSlot).to.equal(1);
    });
  });

  describe('forgingProgress()', function () {
    it('subtracts unprocessed delegates from the round size', function () {
      expect(forgingProgress({ unprocessed: 21 })).to.equal(80);
    });

    it('caps at the full round when everything is processed', function () {
      expect(forgingProgress({ unprocessed: 0 })).to.equal(101);
    });
  });

  describe('totalBlockRewards()', function () {
    it('subtracts the initial supply without floating-point precision loss', function () {
      expect(totalBlockRewards('11451031950000000')).to.equal('1651031950000000');
    });

    it('returns zero for missing, malformed, or pre-genesis supply', function () {
      expect(totalBlockRewards()).to.equal('0');
      expect(totalBlockRewards('invalid')).to.equal('0');
      expect(totalBlockRewards('9700000000000000')).to.equal('0');
    });
  });
});
