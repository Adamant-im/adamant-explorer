import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const known = require('../../known.json');
const { EXCHANGE_ADDRESSES, inTx } = require('../../utils/knownAddresses.js');

describe('known exchange addresses', function () {
  it('loads all exchange wallets with owner-only source entries', function () {
    expect(EXCHANGE_ADDRESSES.size).to.equal(30);

    for (const address of EXCHANGE_ADDRESSES) {
      expect(known[address]).to.be.an('object');
      expect(Object.keys(known[address])).to.deep.equal(['owner']);
      expect(known[address].owner).to.be.a('string').and.not.equal('');
    }
  });

  it('enriches exchange counterparties with their semantic kind', function () {
    const tx = inTx({
      type: 0,
      senderId: 'U14896035773883208990',
      recipientId: 'U6264905194742584837',
    });

    expect(tx.knownSender).to.deep.equal({ owner: 'Biconomy', kind: 'exchange' });
    expect(tx.knownRecipient).to.deep.equal({ owner: 'FameEX-01', kind: 'exchange' });
  });
});
