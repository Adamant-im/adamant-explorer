const { promises: dnsPromises } = require('dns');
const logger = require('../../../../utils/log');
const { BlocksStatistics, RollingBlocksWindow } = require('./blockStatistics');

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

    for (const peer of peers) {
      this.ips.push(peer.ip);

      peer.osBrand = this.#osBrand(peer.os);
      peer.location = await this.locator.locateIp(peer.ip);

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
  cache = {};

  /**
   * Get geo data and host name for an IP address.
   *
   * Geo lookup failures degrade gracefully: the peer is still listed,
   * only without location details. Never rejects.
   * @param {string} ip IPv4 address of a peer
   * @returns {Promise<Object>} Geo data with a `hostname` field
   */
  async locateIp(ip) {
    if (this.cache[ip]) {
      return this.cache[ip];
    }

    let data = {};

    try {
      // Load node-backed requests only when geo lookup is actually used. This
      // keeps pure peer-classification consumers free of network side effects.
      const statistics = require('../requests/statistics');
      data = (await statistics.getFreegeoip(ip)) ?? {};
    } catch (error) {
      logger.debug(
        `Peer locator: Geo lookup failed for ${ip}; peer will remain without location data: ${error}`,
      );
    }

    data.hostname = await dnsPromises
      .reverse(ip)
      .then((hostnames) => hostnames[0])
      .catch((error) => {
        logger.debug(
          `Peer locator: Reverse DNS failed for ${ip}; using fallback hostname: ${error}`,
        );
        return `${ip}.unknown`;
      });

    this.cache[ip] = data;

    return data;
  }

  /**
   * Drop cached locations for IP addresses that are no longer in the peer list.
   * @param {Array<string>} ips IP addresses seen in the latest peers snapshot
   */
  updateCache(ips) {
    for (const ip in this.cache) {
      if (!ips.includes(ip)) {
        logger.debug(`Peer locator: Removed stale cache entry for ${ip}`);
        delete this.cache[ip];
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
