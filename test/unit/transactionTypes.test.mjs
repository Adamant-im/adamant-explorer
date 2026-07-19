import { expect } from 'chai';
import {
  TRANSACTION_TYPES,
  OPERATION_TYPE_OPTIONS,
  operationTypeId,
  operationMeta,
  operationRecipient,
} from '../../src/lib/transactionTypes.js';

describe('transactionTypes.js', function () {
  it('covers every adamant-api transaction type', function () {
    expect(TRANSACTION_TYPES.map(({ type }) => type)).to.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(OPERATION_TYPE_OPTIONS.map(({ id }) => id)).to.include.members([
      'welcome-bonus',
      'deposit',
      'withdraw',
      'unvote',
      'vote-unvote',
      'message',
      'state',
    ]);
  });

  it('derives exchange deposits and withdrawals', function () {
    expect(operationTypeId({ type: 0, knownRecipient: { kind: 'exchange' } })).to.equal('deposit');
    expect(operationTypeId({ type: 0, knownSender: { kind: 'exchange' } })).to.equal('withdraw');
    expect(operationTypeId({ type: 0 })).to.equal('transfer');
  });

  it('derives the Adoption and Bounty welcome bonus', function () {
    const welcomeBonus = {
      type: 0,
      amount: 10_000_000,
      senderId: 'U15423595369615486571',
      knownSender: { owner: 'Renamed onboarding wallet', kind: 'known' },
    };

    expect(operationTypeId(welcomeBonus)).to.equal('welcome-bonus');
    expect(operationMeta(welcomeBonus).label).to.equal('Welcome bonus');
    expect(operationTypeId({ ...welcomeBonus, amount: 10_000_001 })).to.equal('transfer');
    expect(
      operationTypeId({
        ...welcomeBonus,
        senderId: 'U1',
        knownSender: { owner: 'Adoption and Bounty', kind: 'known' },
      }),
    ).to.equal('transfer');
  });

  it('uses dedicated DApp transfer icons', function () {
    expect(operationMeta({ type: 6 }).icon).to.equal('dapp-deposit');
    expect(operationMeta({ type: 7 }).icon).to.equal('dapp-withdrawal');
  });

  it('derives unvotes from processed and raw vote assets', function () {
    expect(operationTypeId({ type: 3, votes: { deleted: [{}] } })).to.equal('unvote');
    expect(operationTypeId({ type: 3, asset: { votes: ['-public-key'] } })).to.equal('unvote');
    expect(operationMeta({ type: 3, votes: { added: [{}] } }).label).to.equal('Vote');
  });

  it('derives mixed vote and unvote operations', function () {
    expect(
      operationMeta({
        type: 3,
        votes: { added: [{}, {}, {}], deleted: [{}, {}, {}, {}] },
      }).label,
    ).to.equal('Vote & Unvote');
    expect(
      operationTypeId({
        type: 3,
        asset: { votes: ['+added-key', '-deleted-key'] },
      }),
    ).to.equal('vote-unvote');
  });

  it('resolves delegate registrations and keeps vote recipients protocol-level', function () {
    expect(
      operationRecipient({
        type: 2,
        senderId: 'U1',
        asset: { delegate: { username: 'pool' } },
      }),
    ).to.deep.equal({ address: 'U1', label: 'pool', isDelegate: true });

    expect(
      operationRecipient({
        type: 3,
        votes: { added: [{ delegate: { address: 'U2', username: 'delegate' } }] },
      }),
    ).to.equal(null);
  });
});
