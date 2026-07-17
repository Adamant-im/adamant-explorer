const axios = require('axios');
const api = require('./api');
const config = require('../../../../modules/configReader');
const {
  GEOLOCATION_BATCH_SIZE,
  buildGeoJsRequest,
  normalizeGeoJsLocation,
} = require('../helpers/geolocation');

/**
 * Get a page of peers known to the node.
 * @param {number} offset Number of peers to skip
 * @param {number} limit Maximum number of peers to return
 * @returns {Promise<Array>} List of peers
 * @throws {string} Node error message when the request fails
 */
async function getPeers(offset, limit) {
  const response = await api.getPeers({ orderBy: 'ip:asc', offset, limit });

  if (!response.success) {
    throw response.errorMessage;
  }

  return response.peers;
}

/**
 * Get normalized geo information for peer IP addresses.
 *
 * GeoJS accepts multiple IPs in one request. Callers must keep batches bounded
 * by `GEOLOCATION_BATCH_SIZE` and cache results to avoid excessive API usage.
 * When geo-location is disabled, no request is made to GeoJS.
 * @param {Array<string>} ips IPv4 or IPv6 peer addresses
 * @returns {Promise<Array<Object>>} Normalized locations keyed by their `ip` fields
 * @throws {Error} Invalid input, provider configuration, or network failure
 */
async function getGeoLocations(ips) {
  if (!config.geoLocation.enabled || !ips.length) {
    return [];
  }

  if (config.geoLocation.provider !== 'geojs') {
    throw new Error(`Unsupported geo-location provider: ${config.geoLocation.provider}`);
  }

  if (ips.length > GEOLOCATION_BATCH_SIZE) {
    throw new RangeError(
      `Geo-location batches cannot contain more than ${GEOLOCATION_BATCH_SIZE} IP addresses`,
    );
  }

  const request = buildGeoJsRequest(ips, config.geoLocation.timeout);
  const response = await axios.get(request.url, request.options);
  const items = Array.isArray(response.data) ? response.data : [response.data];

  return items.map(normalizeGeoJsLocation).filter((location) => location.ip);
}

module.exports = {
  GEOLOCATION_BATCH_SIZE,
  getGeoLocations,
  getPeers,
};
