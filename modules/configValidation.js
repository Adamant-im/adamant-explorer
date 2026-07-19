'use strict';

const { isIP } = require('node:net');

const NAMED_PROXY_RANGES = new Set(['loopback', 'linklocal', 'uniquelocal']);

/**
 * Normalize a TCP port from configuration or a command-line string.
 * @param {number|string} value Candidate port
 * @returns {number} Valid TCP port
 * @throws {TypeError} When the value is not an integer from 1 through 65535
 */
function normalizePort(value) {
  const port =
    typeof value === 'string' && /^[0-9]+$/.test(value) ? Number.parseInt(value, 10) : value;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new TypeError('Explorer port must be an integer from 1 through 65535');
  }

  return port;
}

/**
 * Validate the peer geo-location configuration.
 * @param {Object} value Candidate `geoLocation` config section
 * @returns {string|null} Validation error, or `null` when the section is valid
 */
function validateGeoLocationConfig(value) {
  if (typeof value.enabled !== 'boolean') {
    return 'Field "geoLocation.enabled" must be Boolean';
  }

  if (value.provider !== 'geojs') {
    return 'Field "geoLocation.provider" must be "geojs"';
  }

  if (!Number.isInteger(value.timeout) || value.timeout <= 0) {
    return 'Field "geoLocation.timeout" must be a positive integer';
  }

  return null;
}

/**
 * Return whether a trusted-proxy entry is an explicit IP, CIDR, or supported
 * proxy-addr named range.
 * @param {*} value Candidate proxy entry
 * @returns {boolean} Whether Express can safely compile the entry
 */
function isTrustedProxyEntry(value) {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim()) {
    return false;
  }

  const entry = value.trim();

  if (NAMED_PROXY_RANGES.has(entry) || isIP(entry)) {
    return true;
  }

  const [address, prefix, extra] = entry.split('/');
  const family = isIP(address);
  const prefixNumber = Number(prefix);
  const maximumPrefix = family === 4 ? 32 : 128;

  return (
    extra === undefined &&
    family !== 0 &&
    prefix !== '' &&
    Number.isInteger(prefixNumber) &&
    prefixNumber >= 0 &&
    prefixNumber <= maximumPrefix &&
    !(
      (family === 4 && address === '0.0.0.0' && prefixNumber === 0) ||
      (family === 6 && address === '::' && prefixNumber === 0)
    )
  );
}

/**
 * Validate the explicit reverse-proxy trust list.
 *
 * An empty list supports direct exposure. The default `loopback` entry trusts
 * forwarded client addresses only from a local reverse proxy.
 * @param {*} value Candidate `trustedProxies` config value
 * @returns {string|null} Validation error, or `null` when the list is valid
 */
function validateTrustedProxies(value) {
  if (!Array.isArray(value)) {
    return 'Field "trustedProxies" must be an Array';
  }

  if (value.some((entry) => !isTrustedProxyEntry(entry))) {
    return 'Field "trustedProxies" must contain only explicit IPs, CIDRs, or named private ranges';
  }

  return null;
}

module.exports = {
  isTrustedProxyEntry,
  normalizePort,
  validateGeoLocationConfig,
  validateTrustedProxies,
};
