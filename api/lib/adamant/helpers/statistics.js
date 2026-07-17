const { promises: dnsPromises } = require('dns');
const { isIP } = require('node:net');
const logger = require('../../../../utils/log');
const { BlocksStatistics, RollingBlocksWindow } = require('./blockStatistics');
const { GEOLOCATION_BATCH_SIZE } = require('./geolocation');

const GEOLOCATION_CACHE_TTL = 86400000;
const GEOLOCATION_RETRY_INTERVAL = 300000;
const GEOLOCATION_FIELDS = [
  'country_code',
  'country_name',
  'region_name',
  'city',
  'time_zone',
  'latitude',
  'longitude',
];
const NORMALIZED_LOCATION_FIELDS = ['ip', ...GEOLOCATION_FIELDS];

/**
 * Check whether a cached location contains provider geo data, not only DNS data.
 * @param {Object} location Cached peer location
 * @returns {boolean} Whether another provider lookup is unnecessary
 */
function hasGeoLocation(location) {
  return GEOLOCATION_FIELDS.some((field) => location?.[field] !== undefined);
}

/**
 * Collects peers into connected and disconnected lists,
 * enriched with OS branding and geo location.
 */
class PeersStatistics {
  static maxOffset = 900;

  locator = null;

  list = {
    connected: [],
    disconnected: [],
  };

  ips = [];

  /**
   * @param {Locator} locator Shared IP locator with a warm cache
   */
  constructor(locator) {
    this.locator = locator;
  }

  /**
   * Classify a page of peers and enrich each with OS brand and location.
   * @param {Array} peers Peers from the node
   * @returns {Promise<Array>} The enriched peers
   */
  async collect(peers) {
    const result = [];

    peers = bufferPeers(peers);
    peers = peers.filter((p) => p.ip !== '0.0.0.0');
    const locations = await this.locator.locateIps(peers.map((peer) => peer.ip));

    for (const peer of peers) {
      this.ips.push(peer.ip);

      peer.osBrand = this.#osBrand(peer.os);
      peer.location = locations.get(peer.ip) ?? {};

      // Node peer state is authoritative: 0 = banned, 1 = disconnected,
      // 2 = connected. Height may be temporarily absent and must not move a
      // connected peer into the disconnected bucket.
      switch (parseInt(peer.state)) {
        case 2:
          peer.humanState = 'Connected';
          this.list.connected.push(peer);
          break;
        case 1:
          peer.humanState = 'Disconnected';
          this.list.disconnected.push(peer);
          break;
        case 0:
          peer.humanState = 'Banned';
          this.list.disconnected.push(peer);
          break;
        default:
          peer.humanState = 'Unknown';
          this.list.disconnected.push(peer);
      }

      result.push(peer);
    }

    return result;
  }

  /**
   * Map a peer OS string to a name and OS group id used by the frontend.
   * @param {string} os Peer OS string, e.g. `linux4.15.0-70-generic`
   * @returns {{name: string, group: number}} OS brand descriptor
   */
  #osBrand(os) {
    const osBrands = { unknown: 0, darwin: 1, linux: 2, freebsd: 3 };
    const match = os ? os.match(/^[a-z]+/i) : '';
    const name = match ? match[0] : 'unknown';
    const group = osBrands[name] ? osBrands[name] : 0;

    return { name, group };
  }
}

/**
 * Resolves peer IP addresses to geo data and reverse-DNS host names,
 * with an in-memory cache keyed by IP.
 */
class Locator {
  cache = Object.create(null);

  geoLocationExpiresAt = Object.create(null);

  geoLocationRetryAt = Object.create(null);

  /**
   * @param {Object} [dependencies] Testable network dependencies
   * @param {Function} [dependencies.lookupGeoLocations] Batched geo lookup
   * @param {Function} [dependencies.reverseDns] Reverse-DNS lookup
   * @param {Function} [dependencies.now] Current Unix time in milliseconds
   */
  constructor({
    lookupGeoLocations = async (ips) => {
      // Load requests only when geo lookup is used so peer classification
      // remains free of ADAMANT API client initialization side effects.
      const statistics = require('../requests/statistics');
      return statistics.getGeoLocations(ips);
    },
    reverseDns = (ip) => dnsPromises.reverse(ip),
    now = Date.now,
  } = {}) {
    this.lookupGeoLocations = lookupGeoLocations;
    this.reverseDns = reverseDns;
    this.now = now;
  }

  /**
   * Get geo data and a host name for one IP address.
   *
   * Geo lookup failures degrade gracefully: the peer is still listed,
   * only without location details. Never rejects.
   * @param {string} ip IPv4 or IPv6 address of a peer
   * @returns {Promise<Object>} Geo data with a `hostname` field
   */
  async locateIp(ip) {
    const locations = await this.locateIps([ip]);
    return locations.get(ip);
  }

  /**
   * Get geo data and host names for multiple IP addresses.
   *
   * Only uncached valid addresses are sent to the configured provider, in
   * bounded batches. Provider and reverse-DNS failures never reject.
   * @param {Array<string>} ips IPv4 or IPv6 peer addresses
   * @returns {Promise<Map<string, Object>>} Locations keyed by peer IP
   */
  async locateIps(ips) {
    const uniqueIps = [...new Set(ips)];
    const now = this.now();
    const ipsToLocate = uniqueIps.filter(
      (ip) =>
        isIP(ip) &&
        (!hasGeoLocation(this.cache[ip]) || (this.geoLocationExpiresAt[ip] ?? 0) <= now) &&
        (this.geoLocationRetryAt[ip] ?? 0) <= now,
    );

    for (let index = 0; index < ipsToLocate.length; index += GEOLOCATION_BATCH_SIZE) {
      const batch = ipsToLocate.slice(index, index + GEOLOCATION_BATCH_SIZE);
      let locations = [];

      try {
        locations = (await this.lookupGeoLocations(batch)) ?? [];
      } catch (error) {
        logger.debug(
          `Peer locator: Geo lookup failed for a batch of ${batch.length} peers; ` +
            `peers will remain without location data: ${error}`,
        );
      }

      const locationsByIp = new Map(
        locations
          .filter((location) => location?.ip && batch.includes(location.ip))
          .map((location) => [location.ip, location]),
      );

      for (const ip of batch) {
        const location = locationsByIp.get(ip);
        this.cache[ip] ??= {};

        if (location && hasGeoLocation(location)) {
          for (const field of NORMALIZED_LOCATION_FIELDS) {
            delete this.cache[ip][field];
          }

          Object.assign(this.cache[ip], location);
          this.geoLocationExpiresAt[ip] = now + GEOLOCATION_CACHE_TTL;
          delete this.geoLocationRetryAt[ip];
        } else {
          this.geoLocationRetryAt[ip] = now + GEOLOCATION_RETRY_INTERVAL;
        }
      }
    }

    const ipsToResolve = uniqueIps.filter((ip) => !this.cache[ip]?.hostname);

    for (const ip of ipsToResolve) {
      const data = this.cache[ip] ?? {};

      data.hostname = await Promise.resolve()
        .then(() => this.reverseDns(ip))
        .then((hostnames) => hostnames[0] || `${ip}.unknown`)
        .catch((error) => {
          logger.debug(
            `Peer locator: Reverse DNS failed for ${ip}; using fallback hostname: ${error}`,
          );
          return `${ip}.unknown`;
        });

      this.cache[ip] = data;
    }

    return new Map(uniqueIps.map((ip) => [ip, this.cache[ip]]));
  }

  /**
   * Drop cached locations for IP addresses that are no longer in the peer list.
   * @param {Array<string>} ips IP addresses seen in the latest peers snapshot
   */
  updateCache(ips) {
    const activeIps = new Set(ips);

    for (const ip in this.cache) {
      if (!activeIps.has(ip)) {
        logger.debug(`Peer locator: Removed stale cache entry for ${ip}`);
        delete this.cache[ip];
        delete this.geoLocationExpiresAt[ip];
        delete this.geoLocationRetryAt[ip];
      }
    }
  }

  /**
   * Warm the location cache from a persisted peer snapshot.
   * @param {Array<Object>} peers Previously enriched peers
   */
  restoreCache(peers) {
    let restored = 0;

    for (const peer of peers ?? []) {
      if (peer?.ip && peer.location) {
        this.cache[peer.ip] = peer.location;

        if (hasGeoLocation(peer.location)) {
          this.geoLocationExpiresAt[peer.ip] = this.now() + GEOLOCATION_CACHE_TTL;
        }

        restored++;
      }
    }

    logger.debug(`Peer locator: Restored ${restored} cached locations`);
  }
}

let knownPeers = [];

/**
 * Merge a fresh page of peers into the short-lived peer buffer.
 *
 * The node may omit recently seen peers from a single response;
 * the buffer keeps peers around for 60 seconds to avoid flicker
 * in the Network Monitor.
 * @param {Array} peers Peers from the node
 * @returns {Array} Buffered peers, each with an `id` and a `time` mark
 */
function bufferPeers(peers) {
  try {
    const time = new Date().getTime() / 1000;

    peers.forEach((p) => {
      const peer = knownPeers.find((pp) => pp.ip === p.ip && pp.port === p.port);

      if (!peer) {
        knownPeers.push(p);
      } else {
        const index = knownPeers.findIndex((pp) => peer.ip === pp.ip && peer.port === pp.port);
        if (index > -1) knownPeers[index] = p;
      }

      p.time = time;
    });

    knownPeers.forEach((p, i) => {
      p.id = `${p.ip}_${p.port}`;
      if (time - p.time > 60) delete knownPeers[i];
    });

    // Deleting array elements leaves holes; compact the buffer
    knownPeers = knownPeers.filter((p) => p);
  } catch (e) {
    knownPeers = [];
    logger.error(
      `Peer statistics: Failed to update the in-memory peer buffer; buffer was reset: ${e}`,
    );
  }

  return knownPeers;
}

module.exports = {
  BlocksStatistics,
  RollingBlocksWindow,
  PeersStatistics,
  Locator,
};
