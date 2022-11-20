'use strict';

const axios = require('axios');
const request = require('request');
const _ = require('underscore');
const async = require('async');
const logger = require('../../utils/logger');

module.exports = function (app) {
  function Active() {
    this.getActive = function (cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/?orderBy=rate:asc&limit=101',
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            response.data.delegates = parseDelegates(response.data.delegates);
            return cb(null, response.data);
          } else {
            return cb(response.data.error);
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getForged = function (delegate, cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/forging/getForgedByAccount?generatorPublicKey=' +
          delegate.publicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            delegate.forged = response.data.forged;
            return cb();
          } else {
            delegate.forged = 0;
            return cb();
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };
  }

  this.getActive = function (error, success) {
    const delegates = new Active();

    async.waterfall(
      [
        (cb) => {
          delegates.getActive(cb);
        },
        (result, cb) => {
          async.each(
            result.delegates,
            (delegate, callback) => {
              delegates.getForged(delegate, callback);
            },
            (err) => {
              if (err) {
                return cb(err);
              } else {
                return cb(null, result);
              }
            },
          );
        },
      ],
      (err, result) => {
        if (err) {
          return error({ success: false, error: err });
        } else {
          return success(result);
        }
      },
    );
  };

  function Standby(n) {
    this.limit = 20;
    this.offset = +n;
    this.actualOffset = isNaN(this.offset) ? 101 : this.offset + 101;

    this.pagination = function (totalCount) {
      const pagination = {};
      pagination.currentPage = +this.offset / +this.limit + 1;

      let totalPages = +totalCount / +this.limit;
      if (totalPages < totalCount / this.limit) {
        totalPages++;
      }

      if (pagination.currentPage > 1) {
        pagination.before = true;
        pagination.previousPage = pagination.currentPage - 1;
      }

      if (pagination.currentPage < totalPages) {
        pagination.more = true;
        pagination.nextPage = pagination.currentPage + 1;
      }

      return pagination;
    };
  }

  this.getStandby = function (n, error, success) {
    const delegates = new Standby(n);

    return axios({
      url:
        app.get('lisk address') +
        '/api/delegates/?orderBy=rate:asc' +
        '&limit=' +
        delegates.limit +
        '&offset=' +
        delegates.actualOffset,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return error({
            success: false,
            error: 'Response was unsuccessful',
          });
        }
        if (response.data.success) {
          response.data.delegates = parseDelegates(response.data.delegates);
          response.data.totalCount = response.data.totalCount - 101;
          response.data.pagination = delegates.pagination(response.data.totalCount);
          return success(response.data);
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

  function Registrations() {
    this.getTransactions = function (cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/transactions/?orderBy=timestamp:desc&limit=5&type=2',
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            return cb(null, response.data.transactions);
          } else {
            return cb(response.data.error);
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getDelegate = function (tx, cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/get?publicKey=' +
          tx.senderPublicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            tx.delegate = response.data.delegate;
            return cb();
          } else {
            return cb(response.data.error);
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };
  }

  this.getLatestRegistrations = function (error, success) {
    const registrations = new Registrations();

    async.waterfall(
      [
        (cb) => {
          registrations.getTransactions(cb);
        },
        (transactions, cb) => {
          async.each(
            transactions,
            (tx, callback) => {
              registrations.getDelegate(tx, callback);
            },
            (err) => {
              if (err) {
                return cb(err);
              } else {
                return cb(null, transactions);
              }
            },
          );
        },
      ],
      (err, transactions) => {
        if (err) {
          return error({ success: false, error: err });
        } else {
          return success({ success: true, transactions: transactions });
        }
      },
    );
  };

  function Votes() {
    this.getVotes = function (cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/transactions/?orderBy=timestamp:desc&limit=5&type=3',
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            return cb(null, response.data.transactions);
          } else {
            return cb(response.data.error);
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getDelegate = function (tx, cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/get?publicKey=' +
          tx.senderPublicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            tx.delegate = null;
            return cb();
          }
          if (response.data.success) {
            tx.delegate = response.data.delegate;
            return cb();
          } else {
            tx.delegate = null;
            return cb();
          }
        })
        .catch((error) => {
          tx.delegate = null;
          return cb();
        });
    };
  }

  this.getLatestVotes = function (error, success) {
    const votes = new Votes();

    async.waterfall(
      [
        (cb) => {
          votes.getVotes(cb);
        },
        (transactions, cb) => {
          async.each(
            transactions,
            (tx, callback) => {
              votes.getDelegate(tx, callback);
            },
            (err) => {
              return cb(null, transactions);
            },
          );
        },
      ],
      (err, transactions) => {
        if (err) {
          return error({ success: false, error: err });
        } else {
          return success({ success: true, transactions: transactions });
        }
      },
    );
  };

  this.getNextForgers = function (error, success) {
    return axios({
      url:
        app.get('lisk address') + '/api/delegates/getNextForgers?limit=101',
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return error({
            success: false,
            error: 'Response was unsuccessful',
          });
        }
        if (response.data.success) {
          return success({ success: true, delegates: response.data.delegates });
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

  this.getDelegateProposals = function (error, success) {
    let offset = 0;
    let nextPage = false;
    const limit = 25;
    const url = 'https://forum.lisk.io/viewforum.php?f=48&start=';
    const nextPageRegex = /<li class="next"><a href.+? rel="next" role="button">/m;
    const proposalRegex = /<a href="\.\/viewtopic\.php\?f=48&amp;t=(\d+)&amp;sid=.+?" class="topictitle">(.+?)\s+(?:[-–](?:\s*rank)?\s*#\s*\d+\s*)?.*?[-–]\s+(.+?)<\/a>/gim;
    const result = [];

    async.doUntil(
      (next) => {
        logger.info('Parsing delegate proposals: ' + url + offset);
        return axios({
          url: url + offset,
          method: 'get',
        })
          .then((response) => {
            if (response.status !== 200) {
              return next('Response was unsuccessful');
            }

            // Parse delegate proposal topics titles
            let m;
            do {
              m = proposalRegex.exec(response.data);
              if (m) {
                result.push({
                  topic: m[1],
                  name: m[2].toLowerCase(),
                  description: _.unescape(m[3]),
                });
              }
            } while (m);

            // Continue if there is next page
            nextPage = nextPageRegex.exec(response.data);
            return next();
          })
          .catch((err) => {
            return next(err);
          });
      },
      () => {
        offset += limit;
        return !nextPage;
      },
      (err) => {
        if (err) {
          error({
            success: false,
            error: err || 'Unable to parse delegate proposals',
          });
        } else {
          success({ success: true, proposals: result, count: result.length });
        }
      },
    );
  };

  function LastBlock() {
    this.getBlock = function (cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/blocks?&orderBy=height:desc&limit=1',
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success && _.size(response.data.blocks) === 1) {
            return cb(null, response.data.blocks[0]);
          } else {
            return cb(response.data.error);
          }
        })
        .catch((err) => {
            return cb(err);
        });
    };

    this.getDelegate = function (block, cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/get?publicKey=' +
          block.generatorPublicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            block.delegate = response.data.delegate;
          } else {
            block.delegate = null;
          }
          return cb(null, block);
        })
        .catch((err) => {
          return cb(err);
        });
    };
  }

  this.getLastBlock = function (error, success) {
    const lastBlock = new LastBlock();

    async.waterfall(
      [
        (cb) => {
          lastBlock.getBlock(cb);
        },
        (result, cb) => {
          lastBlock.getDelegate(result, cb);
        },
      ],
      (err, result) => {
        if (err) {
          return error({ success: false, error: err });
        } else {
          return success({ success: true, block: result });
        }
      },
    );
  };

  this.getLastBlocks = function (params, error, success) {
    if (!params.publicKey) {
      return error({
        success: false,
        error: 'Missing/Invalid publicKey parameter',
      });
    }

    if (isNaN(+params.limit) || params.limit > 20) {
      params.limit = 20;
    }

    return axios({
      url:
        app.get('lisk address') +
        '/api/blocks?orderBy=height:desc&generatorPublicKey=' +
        params.publicKey +
        '&limit=' +
        params.limit,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return error({ success: false, error: undefined });
        }
        response.data.blocks = _.isArray(response.data.blocks) ? response.data.blocks : [];
        return success({ success: true, blocks: response.data.blocks });
      })
      .catch((err) => {
        return error({ success: false, error: err });
      });
  };

  this.getSearch = function (params, error, success) {
    if (!params || !params.match(/^(?![0-9]{1,21}[L]$)[0-9a-z.]+/i)) {
      return error({
        success: false,
        error: 'Missing/Invalid username parameter',
      });
    }
    return axios({
      url:
        app.get('lisk address') +
        '/api/delegates/search?q=' +
        params +
        '&limit=1',
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200 || response.data.error) {
          return error({
            success: false,
            error: response?.data?.error ?? 'Response was unsuccessful',
          });
        }
        if (!response.data.delegates || !response.data.delegates[0]) {
          return error({ success: false, error: 'Delegate not found' });
        }
        return success({ success: true, address: response.data.delegates[0].address });
      })
      .catch((err) => {
        return error({
          success: false,
          error: err,
        });
      });
  };

  const parseDelegates = function (delegates) {
    _.each(delegates, (d) => {
      d.productivity = Math.abs(parseFloat(d.productivity)) || 0.0;
    });

    return delegates;
  };
};
