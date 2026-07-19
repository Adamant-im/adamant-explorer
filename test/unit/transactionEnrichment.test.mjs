import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const accountsPath = require.resolve('../../api/lib/adamant/requests/accounts.js');
const delegatesPath = require.resolve('../../api/lib/adamant/requests/delegates.js');
const knowledgePath = require.resolve('../../utils/knownAddresses.js');
const helpersPath = require.resolve('../../api/lib/adamant/helpers/transactions.js');
const originalModules = new Map(
  [accountsPath, delegatesPath, knowledgePath, helpersPath].map((path) => [
    path,
    require.cache[path],
  ]),
);

describe('transaction enrichment', function () {
  afterEach(function () {
    for (const [path, originalModule] of originalModules) {
      if (originalModule) {
        require.cache[path] = originalModule;
      } else {
        delete require.cache[path];
      }
    }
  });

  it('preserves delegate and recipient public-key fields for known identities', async function () {
    const delegateRequests = [];
    const publicKeyRequests = [];

    require.cache[accountsPath] = {
      exports: {
        async getPublicKey(address) {
          publicKeyRequests.push(address);
          return 'recipient-public-key';
        },
      },
    };
    require.cache[delegatesPath] = {
      exports: {
        async getDelegate(publicKey) {
          delegateRequests.push(publicKey);
          return { publicKey, username: `${publicKey}-delegate` };
        },
      },
    };
    require.cache[knowledgePath] = {
      exports: {
        inTx(transaction) {
          transaction.knownSender = { owner: 'Known sender', kind: 'known' };
          transaction.knownRecipient = { owner: 'Known recipient', kind: 'known' };
          return transaction;
        },
      },
    };
    delete require.cache[helpersPath];

    const { processTransaction } = require(helpersPath);
    const transaction = await processTransaction({
      type: 0,
      senderId: 'U1',
      senderPublicKey: 'sender-public-key',
      recipientId: 'U2',
    });

    expect(publicKeyRequests).to.deep.equal(['U2']);
    expect(delegateRequests).to.deep.equal(['sender-public-key', 'recipient-public-key']);
    expect(transaction.senderDelegate).to.deep.include({ publicKey: 'sender-public-key' });
    expect(transaction.recipientPublicKey).to.equal('recipient-public-key');
    expect(transaction.recipientDelegate).to.deep.include({ publicKey: 'recipient-public-key' });
  });
});
