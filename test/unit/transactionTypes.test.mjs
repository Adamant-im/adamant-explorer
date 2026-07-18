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
      'deposit',
      'withdraw',
      'unvote',
      'message',
      'state',
    ]);
  });

  it('derives exchange deposits and withdrawals', function () {
    expect(operationTypeId({ type: 0, knownRecipient: { kind: 'exchange' } })).to.equal('deposit');
    expect(operationTypeId({ type: 0, knownSender: { kind: 'exchange' } })).to.equal('withdraw');
    expect(operationTypeId({ type: 0 })).to.equal('transfer');
  });

  it('derives unvotes from processed and raw vote assets', function () {
    expect(operationTypeId({ type: 3, votes: { deleted: [{}] } })).to.equal('unvote');
    expect(operationTypeId({ type: 3, asset: { votes: ['-public-key'] } })).to.equal('unvote');
    expect(operationMeta({ type: 3, votes: { added: [{}] } }).label).to.equal('Vote');
  });

  it('resolves delegate registration and vote recipients', function () {
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
    ).to.deep.equal({ address: 'U2', label: 'delegate', isDelegate: true });
  });
});
