import { expect } from 'chai';
import { createPinia, setActivePinia } from 'pinia';

import { useNetworkStore } from '../../src/stores/network.js';

describe('Pinia network store', function () {
  beforeEach(function () {
    setActivePinia(createPinia());
  });

  it('creates the expected isolated initial network state', function () {
    const firstStore = useNetworkStore();

    expect(firstStore.blockStatus).to.equal(null);
    expect(firstStore.latestBlock).to.equal(null);
    expect(firstStore.currency).to.deep.equal({
      symbol: 'ADM',
      tickers: {},
    });

    firstStore.$patch({
      latestBlock: { id: '123', height: 456 },
      currency: { symbol: 'USD', tickers: { ADM: { USD: 0.01 } } },
    });

    setActivePinia(createPinia());
    const secondStore = useNetworkStore();

    expect(secondStore.latestBlock).to.equal(null);
    expect(secondStore.currency).to.deep.equal({
      symbol: 'ADM',
      tickers: {},
    });
  });
});
