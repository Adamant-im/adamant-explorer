import { expect } from 'chai';
import configValidation from '../../modules/configValidation.js';

const { normalizePort, validateGeoLocationConfig, validateTrustedProxies } = configValidation;
const invalidTrustedProxyConfigs = [
  ['boolean', true],
  ['empty entry', ['']],
  ['wildcard', ['*']],
  ['boolean-like entry', ['true']],
  ['whitespace-padded entry', [' loopback ']],
  ['all IPv4 addresses', ['0.0.0.0/0']],
  ['all IPv6 addresses', ['::/0']],
  ['invalid prefix', ['192.0.2.1/129']],
];
const invalidPorts = [
  ['suffix', '6040x'],
  ['empty string', ''],
  ['zero', 0],
  ['above range', 65_536],
  ['fraction', 1.5],
];

describe('Explorer config validation', function () {
  describe('TCP port', function () {
    it('normalizes command-line strings without turning them into IPC socket paths', function () {
      expect(normalizePort('6040')).to.equal(6040);
      expect(normalizePort(6040)).to.equal(6040);
    });

    for (const [label, value] of invalidPorts) {
      it(`rejects an invalid port: ${label}`, function () {
        expect(() => normalizePort(value)).to.throw(TypeError);
      });
    }
  });

  describe('Geo-location config', function () {
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

  describe('Trusted proxy config', function () {
    it('accepts direct exposure, loopback nginx, and explicit proxy networks', function () {
      expect(validateTrustedProxies([])).to.equal(null);
      expect(validateTrustedProxies(['loopback', 'linklocal', 'uniquelocal'])).to.equal(null);
      expect(validateTrustedProxies(['127.0.0.1', '10.20.0.0/16', '2001:db8::/64'])).to.equal(null);
    });

    for (const [label, value] of invalidTrustedProxyConfigs) {
      it(`rejects an unsafe or malformed proxy list: ${label}`, function () {
        expect(validateTrustedProxies(value)).to.be.a('string');
      });
    }
  });
});
