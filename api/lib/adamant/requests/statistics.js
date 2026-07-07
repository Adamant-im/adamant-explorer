const axios = require('axios');
const api = require('./api');
const config = require('../../../../modules/configReader');

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
 * Get geo information for an IP address from the local freegeoip service.
 *
 * The service is self-hosted, see the README. Replacing freegeoip with
 * a maintained geo-location source is tracked as a separate issue.
 * @param {string} ip IPv4 address of a peer
 * @returns {Promise<Object>} Geo data: country, city, coordinates, and more
 * @throws {Error} Network error when the freegeoip service is unreachable
 */
async function getFreegeoip(ip) {
  const response = await axios.get(
    `http://${config.freegeoip.host}:${config.freegeoip.port}/json/${ip}`,
  );

  return response.data;
}

module.exports = {
  getPeers,
  getFreegeoip,
};
