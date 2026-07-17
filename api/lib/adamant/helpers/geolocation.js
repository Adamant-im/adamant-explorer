'use strict';

const { isIP } = require('node:net');

const GEOLOCATION_BATCH_SIZE = 100;
const GEOJS_ENDPOINT = 'https://get.geojs.io/v1/ip/geo.json';

/**
 * Add a non-empty string field to a normalized location.
 * @param {Object} location Normalized location being assembled
 * @param {string} key Public location field name
 * @param {*} value Provider value
 */
function addString(location, key, value) {
  if (typeof value === 'string' && value.trim()) {
    location[key] = value.trim();
  }
}

/**
 * Add a finite coordinate inside its geographic bounds.
 * @param {Object} location Normalized location being assembled
 * @param {'latitude'|'longitude'} key Coordinate field name
 * @param {*} value Provider value
 * @param {number} minimum Minimum valid coordinate
 * @param {number} maximum Maximum valid coordinate
 */
function addCoordinate(location, key, value, minimum, maximum) {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())
  ) {
    return;
  }

  const coordinate = Number(value);

  if (Number.isFinite(coordinate) && coordinate >= minimum && coordinate <= maximum) {
    location[key] = coordinate;
  }
}

/**
 * Normalize a GeoJS result into the location shape consumed by Network Monitor.
 *
 * Unknown or malformed optional values are omitted. Coordinates are converted
 * from GeoJS strings to numbers so Leaflet can distinguish usable locations.
 * @param {Object} data GeoJS response item
 * @returns {Object} Normalized peer location
 */
function normalizeGeoJsLocation(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  const location = {};

  if (typeof data.ip === 'string' && isIP(data.ip)) {
    location.ip = data.ip;
  }

  if (typeof data.country_code === 'string' && /^[a-z]{2}$/i.test(data.country_code.trim())) {
    location.country_code = data.country_code.trim().toUpperCase();
  }

  addString(location, 'country_name', data.country);
  addString(location, 'region_name', data.region);
  addString(location, 'city', data.city);
  addString(location, 'time_zone', data.timezone);
  addCoordinate(location, 'latitude', data.latitude, -90, 90);
  addCoordinate(location, 'longitude', data.longitude, -180, 180);

  return location;
}

/**
 * Build safe Axios options for a GeoJS multi-IP request.
 * @param {Array<string>} ips IPv4 or IPv6 peer addresses
 * @param {number} timeout Request timeout in milliseconds
 * @returns {{url: string, options: {params: {ip: string}, timeout: number}}} Request details
 * @throws {TypeError} An address or timeout is invalid
 */
function buildGeoJsRequest(ips, timeout) {
  if (!Array.isArray(ips) || !ips.length || ips.some((ip) => !isIP(ip))) {
    throw new TypeError('GeoJS lookup requires at least one valid IP address');
  }

  if (!Number.isInteger(timeout) || timeout <= 0) {
    throw new TypeError('GeoJS lookup timeout must be a positive integer');
  }

  return {
    url: GEOJS_ENDPOINT,
    options: {
      params: { ip: ips.join(',') },
      timeout,
    },
  };
}

module.exports = {
  GEOLOCATION_BATCH_SIZE,
  buildGeoJsRequest,
  normalizeGeoJsLocation,
};
