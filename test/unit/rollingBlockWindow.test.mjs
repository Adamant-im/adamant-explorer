import { expect } from 'chai';
import blockStatisticsHelpers from '../../api/lib/adamant/helpers/blockStatistics.js';
import constants from '../../api/lib/adamant/constants.js';

const { RollingBlocksWindow } = blockStatisticsHelpers;
const { BLOCK_INTERVAL_SECONDS } = constants;

function blocks(fromHeight, count, fromTimestamp = fromHeight * BLOCK_INTERVAL_SECONDS) {
  return Array.from({ length: count }, (_, index) => {
    const height = fromHeight - index;

    return {
      id: `block-${height}`,
      height,
      timestamp: fromTimestamp - index * BLOCK_INTERVAL_SECONDS,
    };
  });
}

describe('RollingBlocksWindow', function () {
  it('starts with one page and accumulates overlapping updates', function () {
    const window = new RollingBlocksWindow();

    window.merge(blocks(100, 100));
    const result = window.merge(blocks(160, 100));

    expect(window.blocks).to.have.length(160);
    expect(window.blocks[0].height).to.equal(160);
    expect(window.blocks[159].height).to.equal(1);
    expect(window.coverage.coverageSeconds).to.equal(800);
    expect(window.coverage.complete).to.equal(false);
    expect(result.reset).to.equal(false);
  });

  it('resets when the latest page leaves a height gap', function () {
    const window = new RollingBlocksWindow();

    window.merge(blocks(100, 100));
    const result = window.merge(blocks(250, 100));

    expect(window.blocks).to.have.length(100);
    expect(window.blocks[0].height).to.equal(250);
    expect(window.blocks[99].height).to.equal(151);
    expect(result.reset).to.equal(true);
  });

  it('resets when an overlapping height belongs to a different fork', function () {
    const window = new RollingBlocksWindow();
    const fork = blocks(101, 100);

    window.merge(blocks(100, 100));
    fork[1] = { ...fork[1], id: 'replacement-at-100' };
    window.merge(fork);

    expect(window.blocks).to.have.length(100);
    expect(window.blocks.find((block) => block.height === 100).id).to.equal('replacement-at-100');
  });

  it('keeps a newer cache when a lagging REST page agrees with its chain', function () {
    const window = new RollingBlocksWindow();

    window.merge(blocks(160, 160));
    const result = window.merge(blocks(155, 100));

    expect(result.reset).to.equal(false);
    expect(window.blocks).to.have.length(160);
    expect(window.blocks[0].height).to.equal(160);
  });

  it('replaces the whole cache with a recovery snapshot', function () {
    const window = new RollingBlocksWindow();

    window.merge(blocks(100, 100));
    window.replace(blocks(400, 300));

    expect(window.blocks).to.have.length(300);
    expect(window.blocks[0].height).to.equal(400);
    expect(window.blocks[299].height).to.equal(101);
  });

  it('rejects an internally gapped page without corrupting the current window', function () {
    const window = new RollingBlocksWindow();
    const incomplete = blocks(160, 100).filter((block) => block.height !== 120);

    window.merge(blocks(100, 100));
    const result = window.merge(incomplete);

    expect(result).to.include({ reset: true, rejected: true });
    expect(window.blocks).to.have.length(100);
    expect(window.blocks[0].height).to.equal(100);
  });
});
