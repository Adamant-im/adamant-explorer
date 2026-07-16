import { expect } from 'chai';
import schedule from '../../sockets/delegateMonitorSchedule.js';
import * as constants from '../../api/lib/adamant/constants.mjs';

const {
  getForgingSchedule,
  getNextSlotRefreshDelay,
  getRound,
  getRoundDelegates,
  moveForgingScheduleToSlot,
} = schedule;
const { BLOCK_INTERVAL_SECONDS } = constants;

describe('Delegate Monitor schedule', function () {
  it('uses 101-block forging rounds', function () {
    expect(getRound(1)).to.equal(1);
    expect(getRound(101)).to.equal(1);
    expect(getRound(102)).to.equal(2);
  });

  it('aligns refreshes to the absolute five-second slot grid', function () {
    expect(getNextSlotRefreshDelay(4990, 25)).to.equal(35);
    expect(getNextSlotRefreshDelay(5000, 25)).to.equal(5025);
  });

  it('uses the Node schedule and projects its tail as the current forger', function () {
    const delegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const projected = getForgingSchedule({
      delegates,
      currentBlock: 100,
      currentBlockSlot: 999,
      currentSlot: 1000,
    });

    expect(projected.delegates).to.deep.equal(delegates);
    expect(projected.delegates[100]).to.equal(projected.currentForger);
  });

  it('advances a projected schedule immediately at a local slot boundary', function () {
    const delegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const projected = getForgingSchedule({
      delegates,
      currentBlock: 100,
      currentBlockSlot: 999,
      currentSlot: 1000,
    });
    const advanced = moveForgingScheduleToSlot(projected, 1001);

    expect(advanced.currentSlot).to.equal(1001);
    expect(advanced.currentForger).to.equal(projected.delegates[0]);
  });

  it('counts 101 slots at a round boundary and decreases after a missed slot', function () {
    const delegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const boundary = getForgingSchedule({
      delegates,
      currentBlock: 101,
      currentBlockSlot: 1000,
      currentSlot: 1000,
    });
    const blocks = [{ height: 101, timestamp: 1000 * BLOCK_INTERVAL_SECONDS }];
    const firstSlot = moveForgingScheduleToSlot(boundary, 1001);
    const secondSlot = moveForgingScheduleToSlot(firstSlot, 1002);

    expect(getRoundDelegates(boundary, blocks)).to.have.length(0);
    expect(getRoundDelegates(firstSlot, blocks)).to.have.length(101);
    expect(getRoundDelegates(secondSlot, blocks)).to.have.length(100);
  });

  it('keeps the in-progress forger awaiting until its block arrives', function () {
    const orderedDelegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const projected = {
      currentBlock: 99,
      currentBlockSlot: 998,
      currentSlot: 999,
      orderedDelegates,
    };
    const blocks = [
      { height: 99, timestamp: 998 * BLOCK_INTERVAL_SECONDS },
      { height: 1, timestamp: 900 * BLOCK_INTERVAL_SECONDS },
    ];

    expect(getRoundDelegates(projected, blocks)).to.deep.equal([
      orderedDelegates[999 % 101],
      orderedDelegates[1000 % 101],
    ]);
  });

  it('transitions cleanly from two remaining slots into a new round', function () {
    const orderedDelegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const state = {
      orderedDelegates,
    };
    const roundStartBlock = { height: 1, timestamp: 900 * BLOCK_INTERVAL_SECONDS };

    expect(
      getRoundDelegates({ ...state, currentBlock: 99, currentBlockSlot: 998, currentSlot: 998 }, [
        { height: 99, timestamp: 998 * BLOCK_INTERVAL_SECONDS },
        roundStartBlock,
      ]),
    ).to.have.length(2);
    expect(
      getRoundDelegates({ ...state, currentBlock: 100, currentBlockSlot: 999, currentSlot: 999 }, [
        { height: 100, timestamp: 999 * BLOCK_INTERVAL_SECONDS },
        roundStartBlock,
      ]),
    ).to.have.length(1);
    expect(
      getRoundDelegates(
        { ...state, currentBlock: 101, currentBlockSlot: 1000, currentSlot: 1000 },
        [{ height: 101, timestamp: 1000 * BLOCK_INTERVAL_SECONDS }, roundStartBlock],
      ),
    ).to.have.length(0);
    expect(
      getRoundDelegates(
        {
          ...state,
          currentBlock: 101,
          currentBlockSlot: 1000,
          currentSlot: 1001,
        },
        [{ height: 101, timestamp: 1000 * BLOCK_INTERVAL_SECONDS }, roundStartBlock],
      ),
    ).to.have.length(101);
  });

  it('decreases awaiting delegates when a slot is missed', function () {
    const orderedDelegates = Array.from({ length: 101 }, (_, index) => `delegate-${index}`);
    const blocks = [
      { height: 50, timestamp: 949 * BLOCK_INTERVAL_SECONDS },
      { height: 1, timestamp: 900 * BLOCK_INTERVAL_SECONDS },
    ];
    const beforeMiss = getRoundDelegates(
      {
        orderedDelegates,
        currentBlock: 50,
        currentBlockSlot: 949,
        currentSlot: 950,
      },
      blocks,
    );
    const afterMiss = getRoundDelegates(
      {
        orderedDelegates,
        currentBlock: 50,
        currentBlockSlot: 949,
        currentSlot: 951,
      },
      blocks,
    );

    expect(afterMiss).to.have.length(beforeMiss.length - 1);
  });
});
