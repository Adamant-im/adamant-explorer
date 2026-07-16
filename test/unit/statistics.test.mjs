import { expect } from 'chai';
import blockStatisticsHelpers from '../../api/lib/adamant/helpers/blockStatistics.js';

const { BlocksStatistics } = blockStatisticsHelpers;

describe('BlocksStatistics', function () {
  it('aggregates only the bounded 100-block window', function () {
    const blocks = Array.from({ length: 101 }, (_, index) => ({
      id: String(index),
      timestamp: 1000 - index,
      totalAmount: index,
      totalFee: 1,
      numberOfTransactions: index % 2,
    }));
    const statistics = new BlocksStatistics(100);

    statistics.inspect(blocks);

    expect(statistics.volume.blocks).to.equal(100);
    expect(statistics.volume.beginning).to.equal(901);
    expect(statistics.volume.end).to.equal(1000);
    expect(statistics.best.block.id).to.equal('99');
  });
});
