const { promises: dnsPromises } = require('dns');
const logger = require('../../../../utils/log');
const statistics = require('../requests/statistics');

/**
 * Aggregates volume and best-block statistics over a window
 * of recent blocks (about one day, 8640 blocks).
 */
class BlocksStatistics {
  static maxOffset = 8600;
  static maxCount = 8640;

  best = {
    block: null,
    amount: 0,
  };

  volume = {
    amount: 0,
    blocks: 0,
    txs: 0,
    withTxs: 0,
    beginning: null,
    end: null,
  };

  /**
   * Add a page of blocks to the aggregated statistics.
   * @param {Array} blocks Blocks in descending height order
   * @param {number} offset Offset the page was fetched with
   */
  inspect(blocks, offset) {
    if (blocks.length <= 0) {
      return;
    }

    for (const block of blocks) {
      if (this.volume.blocks >= BlocksStatistics.maxCount) {
        break;
      }

      const newAmount = block.totalAmount + block.totalFee;

      this.volume.blocks += 1;
      this.volume.txs += block.numberOfTransactions;
      this.volume.amount += newAmount;

      if (newAmount > 0) {
        this.volume.withTxs += 1;

        if (newAmount > this.best.amount) {
          this.best.block = block;
          this.best.amount = newAmount;
        }
      }
    }

    if (offset === 0) {
      this.volume.beginning = blocks[blocks.length - 1].timestamp;
    } else if (offset === this.maxOffset) {
      this.volume.end = blocks[0].timestamp;
    }
  }
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

    for (const peer of peers) {
      this.ips.push(peer.ip);

      peer.osBrand = this.#osBrand(peer.os);
      peer.location = await this.locator.locateIp(peer.ip);

      switch (parseInt(peer.state)) {
        case 1:
          peer.humanState = 'Disconnected';
          this.list.disconnected.push(peer);
          break;
        case 2:
          if (peer.height !== null) {
            peer.humanState = 'Connected';
            this.list.connected.push(peer);
          } else {
            peer.humanState = 'Connected';
            this.list.disconnected.push(peer);
          }
          break;
        case 0:
          if (peer.height !== null) {
            peer.humanState = 'Unknown';
            this.list.connected.push(peer);
          } else {
            peer.humanState = 'Unknown';
            this.list.disconnected.push(peer);
          }
          break;
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
      logger.log(`Locator: Using cached location for ${ip}`);
      return this.cache[ip];
    }

    let data = {};

    try {
      data = (await statistics.getFreegeoip(ip)) ?? {};
    } catch (error) {
      logger.debug(`Locator: Failed to get location for ${ip}: ${error}`);
    }

    data.hostname = await dnsPromises
      .reverse(ip)
      .then((hostnames) => hostnames[0])
      .catch(() => {
        logger.debug(`Locator: Failed to get host name for ${ip}`);
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
        logger.debug(`Locator: Removing stale location for ${ip}`);
        delete this.cache[ip];
      }
    }
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
    logger.error(`Failed to buffer peers: ${e}`);
  }

  return knownPeers;
}

module.exports = {
  BlocksStatistics,
  PeersStatistics,
  Locator,
};
