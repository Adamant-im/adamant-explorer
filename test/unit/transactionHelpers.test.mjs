import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const {
  concatenateTransactions,
  sortTransactions,
} = require('../../api/lib/adamant/helpers/transactionList.js');

describe('transaction list helpers', function () {
  it('keeps equal-second transactions in a deterministic chain order', function () {
    const transactions = [
      { id: '2', timestamp: 100, height: 10 },
      { id: '10', timestamp: 100, height: 11 },
      { id: '20', timestamp: 101, height: 9 },
      { id: '3', timestamp: 100, height: 11 },
    ];

    expect(sortTransactions(transactions).map(({ id }) => id)).to.deep.equal([
      '20',
      '10',
      '3',
      '2',
    ]);
    expect(transactions.map(({ id }) => id)).to.deep.equal(['2', '10', '20', '3']);
  });

  it('uses millisecond timestamps before height and id tie breakers', function () {
    const transactions = [
      { id: '20', timestamp: 100, timestampMs: 100001, height: 12 },
      { id: '10', timestamp: 100, timestampMs: 100002, height: 11 },
    ];

    expect(sortTransactions(transactions).map(({ id }) => id)).to.deep.equal(['10', '20']);
  });

  it('merges confirmed and unconfirmed lists into a stable 20-row page', function () {
    const confirmed = Array.from({ length: 20 }, (_, index) => ({
      id: String(index + 1),
      timestamp: 100,
      height: 10,
    }));
    const unconfirmed = [{ id: '21', timestamp: 101 }];

    const merged = concatenateTransactions(confirmed, unconfirmed);

    expect(merged).to.have.length(20);
    expect(merged[0].id).to.equal('21');
    expect(merged.at(-1).id).to.equal('2');
  });
});
