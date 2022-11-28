'use strict';

const _ = require('underscore');
const async = require('async');
const dns = require('dns');
const logger = require('../../utils/log');
const axios = require("axios");

module.exports = function (app) {
  function Blocks() {
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

    this.url = function (offset, limit) {
      return url('/api/blocks?&orderBy=height:desc', offset, limit);
    };

    this.inspect = function (blocks, offset) {
      if (_.size(blocks) <= 0) {
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

  this.getBlocks = function (error, success) {
    let offset = 0;
    const limit = 100;
    const blocks = new Blocks();

    async.doUntil(
      (next) => {
        return axios({
          url: app.get('adamant address') + blocks.url(offset, limit),
          method: 'get',
        })
          .then((response) => {
            if (response.status !== 200) {
              return next('Response was unsuccessful');
            }

            blocks.inspect(response.data.blocks, offset);
            return next();
          })
          .catch((err) => {
            return next(err);
          });
      },
      () => {
        offset += limit;

        return offset > blocks.maxOffset;
      },
      (err) => {
        if (err) {
          logger.info('Error retrieving Blocks: ' + err);
          return error({ success: false, error: err });
        } else {
          return success({
            success: true,
            best: blocks.best.block,
            volume: blocks.volume,
          });
        }
      },
    );
  };

  this.getLastBlock = function (error, success) {
    const blocks = new Blocks();

    return axios({
      url: app.get('adamant address') + blocks.url(0, 1),
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return error({
            success: false,
            error: 'Response was unsuccessful',
          });
        }

        if (_.size(response.data.blocks) > 0) {
          return success({ success: true, block: response.data.blocks[0] });
        } else {
          return error({ success: false, error: response.data.error });
        }
      })
      .catch((err) => {
        return error({
          success: false,
          error: err,
        });
      });
  };

  function Locator() {
    this.disabled = false;

    this.locate = function (ip, cb) {
      const location = cache[ip];

      if (this.disabled) {
        return cb(null);
      } else if (location) {
        logger.log('Locator:  ' + 'Using cached location for: ' + ip);
        return cb(location);
      } else {
        logger.log('Locator:  ' + 'Requesting new location for: ' + ip);
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
        url: app.get('freegeoip address') + '/json/' + ip,
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

  this.locator = new Locator();

  function Peers(locator) {
    this.maxOffset = 900; // 1000

    this.list = {
      connected: [], // 1
      disconnected: [], // 2
    };

    this.ips = [];
    this.locations = locator;

    this.url = function (offset, limit) {
      return url('/api/peers?orderBy=ip:asc', offset, limit);
    };

    this.collect = function (peers) {
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

  this.getPeers = function (error, success) {
    let offset = 0;
    let found = false;
    const limit = 100;
    const peers = new Peers(this.locator);

    async.doUntil(
      (next) => {
        return axios({
          url: app.get('adamant address') + peers.url(offset, limit),
          method: 'get',
        })
          .then((response) => {
            if (response.status !== 200) {
              return next('Response was unsuccessful');
            }

            if (_.size(response.data.peers) > 0) {
              peers.collect(_bufferPeers(response.data.peers));
            } else {
              found = true;
            }

            return next();
          })
          .catch((err) => {
            return next(err);
          });
      },
      () => {
        offset += limit;

        return found || offset > peers.maxOffset;
      },
      (err) => {
        peers.locations.update(peers.ips);

        if (err) {
          logger.error('Error retrieving Peers: ' + err);
          return error({ success: false, error: err });
        } else {
          return success({ success: true, list: peers.list });
        }
      },
    );
  };

  // Private

  const url = function (url, offset, limit) {
    if (!isNaN(offset)) {
      url += '&offset=' + offset;
    }
    if (!isNaN(limit)) {
      url += '&limit=' + limit;
    }

    return url;
  };
};

/**
 * Private Buffered connected peers (1 min)
 *
 * @param {array} bufferPeers - buffer connected peers
 * @param {array} peers - array peers from api
 * @returns - updated bufferPeers
 */

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
