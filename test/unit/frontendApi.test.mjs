import { expect } from 'chai';
import { SUPPORTED_API_PATHS } from '../../api/lib/adamant/constants.mjs';
import { apiGet, isSupportedApiPath } from '../../src/lib/api.js';

describe('frontend Explorer API client', function () {
  it('allowlists the retained UI routes and network health endpoint', function () {
    expect(SUPPORTED_API_PATHS).to.have.length(13);

    for (const path of SUPPORTED_API_PATHS) {
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
