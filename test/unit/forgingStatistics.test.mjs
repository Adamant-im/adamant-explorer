import { expect } from 'chai';
import forgingStatistics from '../../api/lib/adamant/helpers/forgingStatistics.js';

const { createForgingBaseline, projectTransactionFees } = forgingStatistics;
const INITIAL_SUPPLY = 9800000000000000n;

describe('All-time forging statistics', function () {
  it('separates rewards and fees while the current round is uncredited', function () {
    const blocks = Array.from({ length: 4 }, (_, index) => ({
      height: 105 - index,
      reward: 100,
      totalFee: 25,
    }));
    const status = {
      height: 105,
      supply: (INITIAL_SUPPLY + 1000n).toString(),
    };
    const delegates = [{ forged: '800' }];

    const baseline = createForgingBaseline(delegates, status, blocks);

    expect(baseline).to.deep.equal({ creditedHeight: 101, transactionFees: '200' });
    expect(projectTransactionFees(baseline, blocks, status.height)).to.equal('300');
  });

  it('uses account totals directly at a completed round boundary', function () {
    const status = {
      height: 101,
      supply: (INITIAL_SUPPLY + 600n).toString(),
    };
    const baseline = createForgingBaseline([{ forged: '800' }], status, []);

    expect(baseline).to.deep.equal({ creditedHeight: 101, transactionFees: '200' });
    expect(projectTransactionFees(baseline, [], status.height)).to.equal('200');
  });

  it('rejects a cache that cannot prove every projected fee', function () {
    const baseline = { creditedHeight: 101, transactionFees: '200' };

    expect(() => projectTransactionFees(baseline, [{ height: 103, totalFee: 25 }], 103)).to.throw(
      'Block cache is missing height 102',
    );
  });
});
