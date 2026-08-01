import { expect } from 'chai';
import geolocationHelpers from '../../api/lib/adamant/helpers/geolocation.js';

const { buildGeoJsRequest, normalizeGeoJsLocation } = geolocationHelpers;

describe('Peer geo-location', function () {
  it('normalizes GeoJS fields for the Network Monitor', function () {
    expect(
      normalizeGeoJsLocation({
        ip: '2001:4860:4860::8888',
        country_code: 'us',
        country: ' United States ',
        region: 'California',
        city: 'Mountain View',
        latitude: '37.4056',
        longitude: '-122.0775',
        timezone: 'America/Los_Angeles',
      }),
    ).to.deep.equal({
      ip: '2001:4860:4860::8888',
      country_code: 'US',
      country_name: 'United States',
      region_name: 'California',
      city: 'Mountain View',
      time_zone: 'America/Los_Angeles',
      latitude: 37.4056,
      longitude: -122.0775,
    });
  });

  it('omits malformed provider fields and out-of-range coordinates', function () {
    expect(
      normalizeGeoJsLocation({
        ip: 'not-an-ip',
        country_code: 'USA',
        country: null,
        latitude: null,
        longitude: '',
      }),
    ).to.deep.equal({});
  });

  it('builds one HTTPS request for multiple validated IP addresses', function () {
    expect(buildGeoJsRequest(['192.0.2.1', '2001:db8::1'], 5000)).to.deep.equal({
      url: 'https://get.geojs.io/v1/ip/geo.json',
      options: {
        params: { ip: '192.0.2.1,2001:db8::1' },
        timeout: 5000,
      },
    });
  });

  it('rejects malformed addresses before they reach the provider', function () {
    expect(() => buildGeoJsRequest(['192.0.2.1/path'], 5000)).to.throw(
      'GeoJS lookup requires at least one valid IP address',
    );
  });
});
