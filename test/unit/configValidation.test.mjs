import { expect } from 'chai';
import configValidation from '../../modules/configValidation.js';

const { validateGeoLocationConfig } = configValidation;

describe('Geo-location config validation', function () {
  it('accepts the supported provider with a positive timeout', function () {
    expect(
      validateGeoLocationConfig({
        enabled: true,
        provider: 'geojs',
        timeout: 5000,
      }),
    ).to.equal(null);
  });

  for (const [field, value, error] of [
    ['enabled', 'true', 'Field "geoLocation.enabled" must be Boolean'],
    ['provider', 'unknown', 'Field "geoLocation.provider" must be "geojs"'],
    ['timeout', 0, 'Field "geoLocation.timeout" must be a positive integer'],
  ]) {
    it(`rejects an invalid ${field}`, function () {
      const config = {
        enabled: false,
        provider: 'geojs',
        timeout: 5000,
        [field]: value,
      };

      expect(validateGeoLocationConfig(config)).to.equal(error);
    });
  }
});
