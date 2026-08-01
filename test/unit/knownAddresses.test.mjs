import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const known = require('../../known.json');
const { inTx } = require('../../utils/knownAddresses.js');

describe('known exchange addresses', function () {
  it('derives all exchange wallets from known-address descriptions', function () {
    const exchanges = Object.entries(known).filter(([, entry]) => entry.description === 'Exchange');

    expect(exchanges).to.have.length(30);

    for (const [, entry] of exchanges) {
      expect(entry.owner).to.be.a('string').and.not.equal('');
    }
  });

  it('enriches exchange counterparties with their semantic kind', function () {
    const tx = inTx({
      type: 0,
      senderId: 'U14896035773883208990',
      recipientId: 'U6264905194743685013',
    });

    expect(tx.knownSender).to.deep.equal({
      owner: 'Biconomy',
      description: 'Exchange',
      kind: 'exchange',
    });
    expect(tx.knownRecipient).to.deep.equal({
      owner: 'FameEX-01',
      description: 'Exchange',
      kind: 'exchange',
    });
  });
});
