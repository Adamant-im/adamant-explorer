const { promises: dnsPromises } = require('dns');
const logger = require('../../../../utils/log');
const statistics = require('../requests/statistics');

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
   * Process blocks and offset data
   * @param {Array} blocks
   * @param {Number} offset
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

class PeersStatistics {
  static maxOffset = 900;

  locator = null;

  list = {
    connected: [],
    disconnected: [],
  };

  ips = [];

  constructor(locator) {
    this.locator = locator;
  }

  async collect(peers) {
    const result = [];

    peers = _bufferPeers(peers);
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

  #osBrand(os) {
    const osBrands = { unknown: 0, darwin: 1, linux: 2, freebsd: 3 };
    const match = os ? os.match(/^[a-z]+/i) : '';
    const name = match ? match[0] : 'unknown';
    const group = osBrands[name] ? osBrands[name] : 0;

    return { name: name, group: group };
  }
}

class Locator {
  cache = {};

  async locateIp(ip) {
    if (this.cache[ip]) {
      logger.log(`Locator: Using cached location for: ${ip}`);
      return this.cache[ip];
    } else {
      const data = (await statistics.getFreegeoip(ip)) ?? {};

      data.hostname = await dnsPromises.reverse(ip)
        .then((hostnames) => hostnames[0])
        .catch((error) => {
          logger.debug(`Locator: Failed to get new hostname for: ${ip}`);
          return `${ip}.unknown`;
        });

      this.cache[ip] = data;

      return data;
    }
  }

  updateCache(ips) {
    for (let ip in this.cache) {
        if (ips.indexOf(ip) === -1) {
          logger.debug('Locator ' + 'Removing stale location: ' + ip);
          delete this.cache[ip];
        }
    }
  }
}


let bufferPeers = [];
function _bufferPeers(peers) {
  try {
    const time = new Date().getTime() / 1000;
    peers.forEach((p) => {
      const peer = bufferPeers.find((pp) => pp.ip === p.ip && pp.port === p.port);
      if (!peer) {
        bufferPeers.push(p);
      } else {
        const index = bufferPeers.findIndex(
          (pp) => peer.ip === pp.ip && peer.port === pp.port,
        );
        if (index > -1) bufferPeers[index] = p;
      }
      p.time = time;
    });

    bufferPeers.forEach((p, i) => {
      p.id = p.ip + '_' + p.port;
      if (time - p.time > 60) delete bufferPeers[i];
    });
    // Removing all falsy values from array
    bufferPeers = bufferPeers.filter((p) => p);
  } catch (e) {
    bufferPeers = [];
    logger.error('Error _bufferPeers: ' + e);
  }

  return bufferPeers;
}

module.exports = {
  BlocksStatistics,
  PeersStatistics,
  Locator,
};
