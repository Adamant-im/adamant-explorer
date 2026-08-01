import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);

describe('Peer geo-location request adapter', function () {
  let requestPath;
  let apiPath;
  let axiosPath;
  let configPath;
  let paths;
  let originalModules;

  beforeEach(function () {
    requestPath = require.resolve('../../api/lib/adamant/requests/statistics.js');
    apiPath = require.resolve('../../api/lib/adamant/requests/api.js');
    axiosPath = require.resolve('axios');
    configPath = require.resolve('../../modules/configReader.js');
    paths = [requestPath, apiPath, axiosPath, configPath];
    originalModules = new Map(paths.map((modulePath) => [modulePath, require.cache[modulePath]]));
  });

  afterEach(function () {
    for (const [modulePath, originalModule] of originalModules) {
      if (originalModule) {
        require.cache[modulePath] = originalModule;
      } else {
        delete require.cache[modulePath];
      }
    }
  });

  function loadRequests({ enabled, responseData }) {
    const calls = [];

    delete require.cache[requestPath];
    require.cache[apiPath] = { exports: { getPeers: async () => ({ success: true }) } };
    require.cache[axiosPath] = {
      exports: {
        get: async (url, options) => {
          calls.push({ url, options });
          return { data: responseData };
        },
      },
    };
    require.cache[configPath] = {
      exports: {
        geoLocation: {
          enabled,
          provider: 'geojs',
          timeout: 2500,
        },
      },
    };

    return {
      calls,
      requests: require(requestPath),
    };
  }

  it('requests and normalizes a bounded GeoJS batch', async function () {
    const { calls, requests } = loadRequests({
      enabled: true,
      responseData: [
        {
          ip: '192.0.2.1',
          country_code: 'NL',
          country: 'Netherlands',
          latitude: '52.3824',
          longitude: '4.8995',
        },
      ],
    });

    expect(await requests.getGeoLocations(['192.0.2.1'])).to.deep.equal([
      {
        ip: '192.0.2.1',
        country_code: 'NL',
        country_name: 'Netherlands',
        latitude: 52.3824,
        longitude: 4.8995,
      },
    ]);
    expect(calls).to.deep.equal([
      {
        url: 'https://get.geojs.io/v1/ip/geo.json',
        options: {
          params: { ip: '192.0.2.1' },
          timeout: 2500,
        },
      },
    ]);
  });

  it('does not send peer IPs when geo-location is disabled', async function () {
    const { calls, requests } = loadRequests({
      enabled: false,
      responseData: null,
    });

    expect(await requests.getGeoLocations(['192.0.2.1'])).to.deep.equal([]);
    expect(calls).to.deep.equal([]);
  });
});
