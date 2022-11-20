'use strict';

const axios = require('axios');
const _ = require('underscore');
const async = require('async');

module.exports = function (app) {
  this.getBlockHeight = function (error, success) {
    return axios({
      url: app.get('lisk address') + '/api/blocks/getHeight',
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
          return success({ success: true, height: response.data.height });
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

  this.getBlockByHeight = function (height, error, success) {
    return axios({
      url: app.get('lisk address') + '/api/blocks?height=' + height,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return error({
            success: false,
            error: 'Response was unsuccessful',
          });
        }
        if (response.data.success && response.data.count !== 0) {
          return success({
            success: true,
            id: response.data.blocks[0].id,
            height: response.data.blocks[0].height,
          });
        } else {
          return error({
            success: false,
            error: 'No block at specified height',
          });
        }
      })
      .catch((err) => {
        return error({
          success: false,
          error: err,
        });
      });
  };

  function Blocks() {
    this.offset = function (n) {
      n = parseInt(n);

      if (isNaN(n) || n < 0) {
        return 0;
      } else {
        return n;
      }
    };

    this.getDelegate = function (result, cb) {
      const block = result;

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
          return cb(null, result);
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.map = function (body) {
      return _.map(body.blocks, function (b) {
        return {
          id: b.id,
          timestamp: b.timestamp,
          generator: b.generatorId,
          totalAmount: b.totalAmount,
          totalFee: b.totalFee,
          reward: b.reward,
          totalForged: b.totalForged,
          transactionsCount: b.numberOfTransactions,
          height: b.height,
          delegate: b.delegate,
        };
      });
    };

    this.pagination = function (n, height) {
      const pagination = {};
      pagination.currentPage = parseInt(n / 20) + 1;

      let totalPages = parseInt(height / 20);
      if (totalPages < height / 20) {
        totalPages++;
      }

      if (pagination.currentPage < totalPages) {
        pagination.before = true;
        pagination.previousPage = pagination.currentPage + 1;
      }

      if (pagination.currentPage > 0) {
        pagination.more = true;
        pagination.nextPage = pagination.currentPage - 1;
      }

      return pagination;
    };
  }

  this.getLastBlocks = function (n, error, success) {
    const blocks = new Blocks();

    this.getBlockHeight(
       (data) => {
        return error({ success: false, error: data.error });
      },
      (data) => {
        if (data.success === true) {
          return axios({
            url:
              app.get('lisk address') +
              '/api/blocks?orderBy=height:desc&limit=20&offset=' +
              blocks.offset(n),
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
                async.forEach(
                  response.data.blocks,
                  function (b, cb) {
                    blocks.getDelegate(b, cb);
                  },
                  function () {
                    return success({
                      success: true,
                      blocks: blocks.map(response.data),
                      pagination: blocks.pagination(n, data.height),
                    });
                  },
                );
              } else {
                return error({
                  success: false,
                  error: response.data.error,
                });
              }
            })
            .catch((err) => {
              return error({
                success: false,
                error: err,
              });
            });
        } else {
          return error({ success: false, error: data.error });
        }
      },
    );
  };

  function Block() {
    this.getBlock = function (blockId, height, cb) {
      return axios({
        url: app.get('lisk address') + '/api/blocks/get?id=' + blockId,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            return cb(null, makeBody(response.data, height));
          } else {
            return cb(response.data.error);
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getDelegate = function (result, cb) {
      const block = result.block;

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
          return cb(null, result);
        })
        .catch((err) => {
          return cb(err);
        });
    };

    // Private

    const makeBody = function (body, height) {
      const b = body.block;

      b.confirmations = height - b.height + 1;
      b.payloadHash = new Buffer(b.payloadHash).toString('hex');

      return body;
    };
  }

  this.getBlock = function (blockId, error, success) {
    const block = new Block();

    if (!blockId) {
      return error({
        success: false,
        error: 'Missing/Invalid blockId parameter',
      });
    }
    this.getBlockHeight(
      (data) => {
        return error({ success: false, error: data.error });
      },
      (data) => {
        if (data.success === false) {
          return error({ success: false, error: data.error });
        } else {
          async.waterfall(
            [
              (cb) => {
                block.getBlock(blockId, data.height, cb);
              },
              (result, cb) => {
                block.getDelegate(result, cb);
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
        }
      },
    );
  };

  this.getHeight = function (height, error, success) {
    const block = new Block();

    if (!height) {
      return error({
        success: false,
        error: 'Missing/Invalid height parameter',
      });
    }
    this.getBlockByHeight(
      height,
      (data) => {
        return error({ success: false, error: data.error });
      },
      (data) => {
        if (data.success === false) {
          return error({ success: false, error: data.error });
        } else {
          async.waterfall(
            [
              (cb) => {
                block.getBlock(data.id, data.height, cb);
              },
              (result, cb) => {
                block.getDelegate(result, cb);
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
        }
      },
    );
  };

  this.getBlockStatus = function (error, success) {
    return axios({
      url: app.get('lisk address') + '/api/blocks/getStatus',
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

  // Private

  const exchange = app.exchange;
};
