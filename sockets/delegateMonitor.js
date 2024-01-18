const async = require('async');
const moment = require('moment');
const delegatesHandler = require('../api/lib/adamant/handlers/delegates');
const blocks = require('../api/lib/adamant/requests/blocks');
const logger = require('../utils/log');

module.exports = function (app, connectionHandler, socket) {
  let intervals = [];
  const connection = new connectionHandler('Delegate Monitor:', socket, this);
  const data = {};
  // Only used in various calculations, will not be emited directly
  const tmpData = {};

  const running = {
    'getActive': false,
    'getLastBlock': false,
    'getRegistrations': false,
    'getVotes': false,
    'getLastBlocks': false,
    'getNextForgers': false,
  };

  this.onInit = function () {
    this.onConnect();

    async.parallel([
        // We only call getLastBlock on init, later data.lastBlock will be updated from getLastBlocks
        getLastBlock,
        getActive,
        getRegistrations,
        getVotes,
        getNextForgers,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          tmpData.nextForgers = res[4];

          data.lastBlock = res[0];
          data.active = updateActive(res[1]);
          data.registrations = res[2];
          data.votes = res[3];
          data.nextForgers = cutNextForgers(10);

          log('info', 'Emitting new data');
          socket.emit('data', data);

          getLastBlocks(data.active, true);

          newInterval(0, 5000, emitData);
          newInterval(1, 1000, getLastBlocks);
        }
      }.bind(this));
  };

  this.onConnect = function () {
    log('info', 'Emitting existing data');
    socket.emit('data', data);
  };

  this.onDisconnect = function () {
    for (let i = 0; i < intervals.length; i++) {
      clearInterval(intervals[i]);
    }
    intervals = [];
  };

  const newInterval = function (i, delay, cb) {
    if (intervals[i] !== undefined) {
      return null;
    } else {
      intervals[i] = setInterval(cb, delay);
      return intervals[i];
    }
  };

  // Private

  const log = function (level, msg) {
    logger[level]('Delegate Monitor:' + msg);
  };

  const cutNextForgers = function (count) {
    const data = tmpData.nextForgers.delegates.slice(0, count);

    data.forEach((publicKey, index) => {
      const existing = findActiveByPublicKey(publicKey);
      data[index] = existing;
    });

    return data;
  };

  const getActive = function (cb) {
    if (running.getActive) {
      return cb('getActive (already running)');
    }
    running.getActive = true;
    delegatesHandler.getActive(
      (res) => {
        running.getActive = false;
        cb('Active');
      },
      (res) => {
        running.getActive = false;
        cb(null, res);
      },
    );
  };

  const findActive = function (delegate) {
    return data.active.delegates.find((d) => {
      return d.publicKey === delegate.publicKey;
    });
  };

  const findActiveByPublicKey = function (publicKey) {
    return data.active.delegates.find((d) => {
      return d.publicKey === publicKey;
    });
  };

  const findActiveByBlock = function (block) {
    return data.active.delegates.find((d) => {
      return d.publicKey === block.generatorPublicKey;
    });
  };

  const updateDelegate = function (delegate, updateForgingTime) {
    // Update delegate with forging time
    if (updateForgingTime) {
      delegate.forgingTime = tmpData.nextForgers.delegates.indexOf(delegate.publicKey) * 10;
    }

    // Update delegate with info if it should forge in current round
    delegate.isRoundDelegate = tmpData.roundDelegates.indexOf(delegate.publicKey) !== -1;
    return delegate;
  };

  const updateActive = function (results) {
    // Calculate list of delegates that should forge in current round
    tmpData.roundDelegates = getRoundDelegates(tmpData.nextForgers.delegates, data.lastBlock.block.height);

    if (!data.active || !data.active.delegates) {
      return results;
    } else {
      results.delegates.forEach((delegate) => {
        const existing = findActive(delegate);

        if (existing) {
          delegate = updateDelegate(delegate, true);
        }

        if (existing && existing.blocks && existing.blocksAt) {
          delegate.blocks = existing.blocks;
          delegate.blocksAt = existing.blocksAt;
        }
      });

      return results;
    }
  };

  const getLastBlock = function (cb) {
    if (running.getLastBlock) {
      return cb('getLastBlock (already running)');
    }
    running.getLastBlock = true;
    delegatesHandler.getLastBlock(
      (res) => {
        running.getLastBlock = false;
        cb('LastBlock');
      },
      (res) => {
        running.getLastBlock = false;
        cb(null, res);
      },
    );
  };

  const getRegistrations = function (cb) {
    if (running.getRegistrations) {
      return cb('getRegistrations (already running)');
    }
    running.getRegistrations = true;
    delegatesHandler.getLatestRegistrations(
      (res) => {
        running.getRegistrations = false;
        cb('Registrations');
      },
      (res) => {
        running.getRegistrations = false;
        cb(null, res);
      },
    );
  };

  const getVotes = function (cb) {
    if (running.getVotes) {
      return cb('getVotes (already running)');
    }
    running.getVotes = true;
    delegatesHandler.getLatestVotes(
      (res) => {
        running.getVotes = false;
        cb('Votes');
      },
      (res) => {
        running.getVotes = false;
        cb(null, res);
      },
    );
  };

  const getNextForgers = function (cb) {
    if (running.getNextForgers) {
      return cb('getNextForgers (already running)');
    }
    running.getNextForgers = true;
    delegatesHandler.getNextForgers(
      (res) => {
        running.getNextForgers = false;
        cb('NextForgers');
      },
      (res) => {
        running.getNextForgers = false;
        cb(null, res);
      },
    );
  };

  const getLastBlocks = function (init) {
    const limit = init ? 100 : 2;

    if (running.getLastBlocks) {
      return log('error', 'getLastBlocks (already running)');
    }
    running.getLastBlocks = true;

    async.waterfall([
      (callback) => {
        return blocks.getBlocks(0, limit)
          .then((response) => {
              return callback(null, {blocks: response});
          })
          .catch((err) => {
            return callback(err);
          });
      },
      (result, callback) => {
        // Set last block and his delegate (we will emit it later in emitData)
        data.lastBlock.block = result.blocks[0];
        const lb_delegate = findActiveByBlock(data.lastBlock.block);
        data.lastBlock.block.delegate = {
          username: lb_delegate.username,
          address: lb_delegate.address,
        };

        async.eachSeries(result.blocks, (b, cb) => {
          let existing = findActiveByBlock(b);

          if (existing) {
            if (!existing.blocks || !existing.blocks[0] || existing.blocks[0].timestamp < b.timestamp) {
              existing.blocks = [];
              existing.blocks.push(b);
              existing.blocksAt = moment();
              existing = updateDelegate(existing, false);
              emitDelegate(existing);
            }
          }

          if (intervals[1]) {
            cb(null);
          } else {
            callback('Monitor closed');
          }
        }, (err) => {
          if (err) {
            callback(err, result);
          }
          callback(null, result);
        });
      },
      (result, callback) => {
        async.eachSeries(data.active.delegates, (delegate, cb) => {
          if (delegate.blocks) {
            return cb(null);
          }
          delegatesHandler.getLastBlocks(
            {
              publicKey: delegate.publicKey,
              limit: 1,
            },
            (res) => {
              log('error', 'Error retrieving last blocks for: ' + delegateName(delegate));
              callback(res.error);
            },
            (res) => {
              let existing = findActive(delegate);

              if (existing) {
                existing.blocks = res.blocks;
                existing.blocksAt = moment();
                existing = updateDelegate(existing, false);
                emitDelegate(existing);
              }

              if (intervals[1]) {
                cb(null);
              } else {
                callback('Monitor closed');
              }
            },
          );
        }, (err) => {
          if (err) {
            callback(err, result);
          }
          callback(null, result);
        });
      },
    ], (err, callback) => {
      if (err) {
        log('error', 'Error retrieving LastBlocks: ' + err);
      }
      running.getLastBlocks = false;
    });
  };

  const getRound = function (height) {
    return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0);
  };

  const getRoundDelegates = function (delegates, height) {
    const currentRound = getRound(height);

    const filtered = delegates.filter((delegate, index) => {
      return currentRound === getRound(height + index + 1);
    });

    return filtered;
  };

  const delegateName = function (delegate) {
    return delegate.username + '[' + delegate.rate + ']';
  };

  const emitData = function () {
    async.parallel([
        getActive,
        getRegistrations,
        getVotes,
        getNextForgers,
      ],
      function (err, res) {
        if (err) {
          log('error', 'Error retrieving: ' + err);
        } else {
          tmpData.nextForgers = res[3];

          data.active = updateActive(res[0]);
          data.registrations = res[1];
          data.votes = res[2];
          data.nextForgers = cutNextForgers(10);

          log('info', 'Emitting data');
          socket.emit('data', data);
        }
      }.bind(this));
  };

  const emitDelegate = function (delegate) {
    log('info', 'Emitting last blocks for: ' + delegateName(delegate));
    socket.emit('delegate', delegate);
  };
};
