import { expect } from 'chai';
import { apiGet, isSupportedApiPath } from '../../src/lib/api.js';

const RETAINED_UI_ROUTES = [
  '/api/getAccount',
  '/api/getTopAccounts',
  '/api/getLastBlocks',
  '/api/getBlock',
  '/api/totalSupply',
  '/api/search',
  '/api/getTransaction',
  '/api/getLastTransfers',
  '/api/getTransactionsByAddress',
  '/api/getTransfersByAddress',
  '/api/getTransactionsByBlock',
  '/api/delegates/getStandby',
];

describe('frontend Explorer API client', function () {
  it('allowlists the retained UI routes and network health endpoint', function () {
    for (const path of [...RETAINED_UI_ROUTES, '/api/networkHealth']) {
      expect(isSupportedApiPath(path), path).to.equal(true);
    }
  });

  it('rejects removed legacy, cross-origin, and path-confusion requests before fetching', async function () {
    for (const path of [
      '/api/version',
      '/api/statistics/getPeers',
      'https://node.example/api/getAccount',
      '/api/getAccount?address=U1',
      '/api/getAccount/../version',
    ]) {
      let error;

      try {
        await apiGet(path);
      } catch (caught) {
        error = caught;
      }

      expect(error, path).to.be.instanceOf(Error);
      expect(error.message).to.equal(`Unsupported Explorer API path: ${path}`);
    }
  });
});
