import { expect } from 'chai';
import constants from '../../api/lib/adamant/constants.js';

describe('ADAMANT network constants', function () {
  it('derives the daily block window from the five-second slot interval', function () {
    expect(constants.BLOCK_INTERVAL_SECONDS).to.equal(5);
    expect(constants.BLOCK_INTERVAL_MILLISECONDS).to.equal(5000);
    expect(constants.BLOCK_CACHE_RECOVERY_BLOCKS).to.equal(300);
    expect(constants.BLOCK_STATISTICS_WINDOW_BLOCKS).to.equal(17280);
  });
});
