
const _ = require("underscore");
const axios = require("axios");
const dns = require("dns");
const async = require("async");
const logger = require("../../../../utils/log");
const config = require("../../../../modules/configReader");

function BlocksStatistics() {
  this.maxOffset = 8600; // 8700
  this.maxCount = 8640; // 24 hours

  this.best = {
    block: null,
    amount: 0,
  };

  this.volume = {
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
  this.inspect = function (blocks, offset) {
    if (blocks.length <= 0) {
      return;
    }

    for (let i = 0; i < blocks.length; i++) {
      if (this.volume.blocks >= this.maxCount) {
        break;
      }

      const newBlock = blocks[i],
        newAmount = newBlock.totalAmount + newBlock.totalFee;

      this.volume.blocks += 1;
      this.volume.txs += newBlock.numberOfTransactions;
      this.volume.amount += newAmount;

      if (newAmount > 0) {
        this.volume.withTxs += 1;

        if (newAmount > this.best.amount) {
          this.best.block = newBlock;
          this.best.amount = newAmount;
        }
      }
    }

    if (offset === 0) {
      this.volume.beginning = blocks[blocks.length - 1].timestamp;
    } else if (offset === this.maxOffset) {
      this.volume.end = blocks[0].timestamp;
    }
  };
}

function PeersStatistics(locator) {
  this.maxOffset = 900; // 1000

  this.list = {
    connected: [], // 1
    disconnected: [], // 2
  };

  this.ips = [];
  this.locations = locator;

  this.collect = function (peers) {
    _bufferPeers(peers);

    let i = 0;
    const self = this;

    peers = _.reject(peers, (p) => {
      return p.ip === '0.0.0.0';
    });

    async.doUntil(
      (next) => {
        self.process(peers[i], next);
      },
      () => {
        i += 1;

        return i + 1 > peers.length;
      },
      (err) => {
        if (err) {
          logger.error('Error collecting peers: ' + err);
          return [];
        } else {
          return peers;
        }
      },
    );
  };

  this.process = function (p, next) {
    p.osBrand = osBrand(p.os);
    this.ips.push(p.ip);

    switch (parseInt(p.state)) {
      case 1:
        p.humanState = 'Disconnected';
        this.list.disconnected.push(p);
        this.locations.locate(p.ip, (res) => {
          p.location = res;
          return next();
        });
        break;
      case 2:
        if (p.height !== null) {
          p.humanState = 'Connected';
          this.list.connected.push(p);
        } else {
          p.humanState = 'Connected';
          this.list.disconnected.push(p);
        }
        this.locations.locate(p.ip, (res) => {
          p.location = res;
          return next();
        });
        break;
      case 0:
        if (p.height !== null) {
          p.humanState = 'Unknown';
          this.list.connected.push(p);
        } else {
          p.humanState = 'Unknown';
          this.list.disconnected.push(p);
        }
        this.locations.locate(p.ip, (res) => {
          p.location = res;
          return next();
        });
        break;
      default:
        return next();
    }
  };

  // Private

  const osBrands = { unknown: 0, darwin: 1, linux: 2, freebsd: 3 };

  const osBrand = function (os) {
    const match = os ? os.match(/^[a-z]+/i) : '';
    const name = match ? match[0] : 'unknown';
    const group = osBrands[name] ? osBrands[name] : 0;

    return { name: name, group: group };
  };
}

function Locator() {
  this.disabled = false;

  this.locate = function (ip, cb) {
    const location = cache[ip];

    if (this.disabled) {
      return cb(null);
    } else if (location) {
      logger.log('Locator: ' + 'Using cached location for: ' + ip);
      return cb(location);
    } else {
      logger.log('Locator: ' + 'Requesting new location for: ' + ip);
      return getLocation(ip, cb);
    }
  };

  this.update = function (ips) {
    for (let ip in cache) {
      if (ips.indexOf(ip) === -1) {
        logger.debug('Locator ' + 'Removing stale location: ' + ip);
        delete cache[ip];
      }
    }
  };

  // Private

  const cache = {};

  const getLocation = function (ip, cb) {
    async.parallel(
      [
        (callback) => {
          getFreegeoip(ip, callback);
        },
        (callback) => {
          getHostName(ip, callback);
        },
      ],
      (err, res) => {
        if (err) {
          logger.debug('Locator: ' + 'Error retrieving location:' + err);
        }

        const data = res[0] || {};
        data.hostname = res[1];

        cache[ip] = data;
        return cb(data);
      },
    );
  };

  const getFreegeoip = function (ip, cb) {
    return axios({
      url: `http://${config.freegeoip.host}:${config.freegeoip.port}` + '/json/' + ip,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          logger.warn('Locator:' + 'Failed to get new location for:' + ip);
          return cb(undefined);
        }

        return cb(null, response.data);
      })
      .catch((err) => {
        logger.warn('Locator: ' + 'Failed to get new location for:' + ip);
        return cb(err);
      });
  };

  const getHostName = function (ip, cb) {
    dns.reverse(ip, (err, hostnames) => {
      let hostname;

      if (err) {
        logger.debug('Locator: ' + 'Failed to get new hostname for:' + ip);
        hostname = ip + '.unknown';
      } else {
        hostname = hostnames[0];
      }

      return cb(err, hostname);
    });
  };
}

let bufferPeers = [];
function _bufferPeers(peers) {
  try {
    const time = new Date().getTime() / 1000;
    peers.forEach((p) => {
      const peer = _.findWhere(bufferPeers, {
        ip: p.ip,
        port: p.port,
      });
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
    bufferPeers = _.compact(bufferPeers);
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
