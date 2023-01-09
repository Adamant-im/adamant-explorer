'use strict';

const _ = require('underscore');
const async = require('async');
const logger = require('../../../utils/log');
const axios = require("axios");

module.exports = function (app) {
  this.getTransaction = function (transactionId, error, success, url) {
    const confirmed = true;
    if (!url) {
      url = '/api/transactions/get?id=';
    }
    if (!transactionId) {
      return error({
        success: false,
        error: 'Missing/Invalid transactionId parameter',
      });
    }

    async.waterfall([
      function (waterCb) {
        return axios({
          url: app.get('adamant address') + url + transactionId,
          method: 'get',
        })
          .then((response) => {
            if (response.status !== 200) {
              return error({
                success: false,
                error: ('Response was unsuccessful'),
              });
            }
            if (response.data.success) {
              return waterCb(null, response.data.transaction);
            } else if (confirmed) {
              return self.getUnconfirmedTransaction(transactionId, error, success);
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
      },
      processTransaction,
    ], (err, transaction) => {
      if (err) {
        return error({
          success: false,
          error: err,
        });
      }

      const t = new Transaction();

      if (transaction.votes) {
        async.waterfall([
          (cb) => {
            if (transaction.votes.added.length) {
              const added = [];
              _.each(transaction.votes.added, (vote) => {
                added.push({
                  publicKey: vote,
                });
              });

              async.forEach(added, (add, cb) => {
                t.getDelegate(add, cb);
              }, () => {
                transaction.votes.added = added;
                return cb(null, transaction);
              });
            } else {
              transaction.votes.added = null;
              return cb(null, transaction);
            }
          },
          function (result, cb) {
            if (result.votes.deleted.length) {
              const deleted = [];
              _.each(result.votes.deleted, (vote) => {
                deleted.push({
                  publicKey: vote,
                });
              });

              async.forEach(deleted, (add, cb) => {
                t.getDelegate(add, cb);
              }, () => {
                result.votes.deleted = deleted;
                return cb(null, result);
              });
            } else {
              result.votes.deleted = null;
              return cb(null, result);
            }
          },
        ], (err, result) => {
          if (err) {
            return error({
              success: false,
              error: err,
            });
          } else {
            return success({
              success: true,
              transaction: result,
            });
          }
        });
      } else {
        return success({
          success: true,
          transaction: transaction,
        });
      }
    });
  };

  function Transaction() {
    this.getDelegate = function (forger, cb) {
      return axios({
        url: app.get('adamant address') + '/api/delegates/get?publicKey=' + forger.publicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            forger.delegate = response.data.delegate;
          } else {
            forger.delegate = null;
          }
          return cb(null, forger);
        })
        .catch((err) => {
          return cb(err);
        });
    };
  }

  this.getUnconfirmedTransaction = function (transactionId, error, success) {
    this.getTransaction(transactionId, error, success, '/api/transactions/unconfirmed/get?id=');
  };

  this.getUnconfirmedTransactions = function (error, success, transactions) {
    async.waterfall([
      function (cb) {
        return axios({
          url: app.get('adamant address') + '/api/transactions/unconfirmed',
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
              if (transactions) {
                response.data.transactions = concatenate(transactions, response.data);
                return cb(null, response.data.transactions);
              }
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
      },
      processTransactions,
    ], (err, result) => {
      if (err) {
        return error({
          success: false,
          error: err,
        });
      } else {
        return success({
          success: true,
          transactions: result,
        });
      }
    });
  };

  this.getLastTransactions = function (error, success) {
    return axios({
      url: app.get('adamant address') + '/api/transactions?orderBy=timestamp:desc&limit=20',
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
          _.each(response.data.transactions, knowledge.inTx);
          return this.getUnconfirmedTransactions(error, success, response.data.transactions);
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
  };

  this.getLastTransfers = function (error, success) {
    return axios({
      url: app.get('adamant address') + '/api/transactions?orderBy=timestamp:desc&limit=20&noClutter=1',
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
          _.each(response.data.transactions, knowledge.inTx);
          return this.getUnconfirmedTransactions(error, success, response.data.transactions);
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
  };

  const normalizeTransactionParams = (params, error) => {
    if (!params || (!params.address && !params.senderId && !params.recipientId)) {
      return 'Missing/Invalid address parameter';
    }

    const directionQueries = [];
    const baseQuery = 'orderBy=timestamp:desc' + '&offset=' + param(params.offset, 0) + '&limit=' + param(params.limit, 100);

    if (params.direction === 'sent') {
      directionQueries.push(`${baseQuery}&and:senderId=${params.address}&and:minAmount=1`);
    } else if (params.direction === 'received') {
      directionQueries.push(`${baseQuery}&and:recipientId=${params.address}&and:minAmount=1`);
    } else if (params.direction === 'others') {
      for (let i = 1; i < 8; i++) {
        directionQueries.push(`${baseQuery}&and:senderId=${params.address}&and:type=${i}`);
      }
    } else if (params.address) {
      directionQueries.push(`${baseQuery}&and:recipientId=${params.address}&or:senderId=${params.address}`);
    } else {
      // advanced search
      let advanced = '';
      Object.keys(params).forEach((key) => {
        if (!(/key|url|parent|orderBy|offset|limit|type|recipientId|query/.test(key))) {
          advanced += `&and:${key}=${params[key]}`;
        }
      });
      // type might be comma separate or undefined
      if (params.type) {
        params.type.split(',').forEach(type => {
          if (type) {
            directionQueries.push(`${baseQuery}${advanced}&and:type=${type}`);
          }
        });
      } else {
        directionQueries.push(`${baseQuery}${advanced}`);
      }

      // If recipientId is the same as senderId, create an extra request for it.
      if (params.recipientId === params.senderId) {
        const reqs = directionQueries.length;
        for (let i = 0; i < reqs; i++) {
          directionQueries.push(directionQueries[i].replace('senderId', 'recipientId'));
        }
      } else if (params.recipientId && !params.senderId) {
        directionQueries.forEach((directionQuery, index) => {
          directionQueries[index] = `${directionQuery}&and:recipientId=${params.recipientId}`;
        });
      }
    }

    return directionQueries;
  };

  this.getTransactionsByAddress = function (query, error, success, isTransfersOnly) {
    const data = normalizeTransactionParams(query, error);
    if (typeof data === 'string') {
      return error({
        success: false,
        error: data,
      });
    }

    const indexOfById = (list, item) => {
      let index = -1;
      list.forEach((mem, i) => {
        if (mem.id === item.id) {
          index = i;
        }
      });

      return index;
    };

    async.waterfall([
      function (cb) {
        let transactionsList = [];
        let errorMessage;
        data.forEach(function (directionQuery, index) {
          let uri = `/api/transactions?${directionQuery}`;
          if (isTransfersOnly && ~directionQuery.indexOf('senderId') && ~directionQuery.indexOf('recipientId')) {
            const address = _.last(directionQuery.split('='));
            uri = '/api/transactions?noClutter=1&' + directionQuery.split('recipientId')[0] + 'inId=' + address;
          } else if (isTransfersOnly) {
            uri = '/api/transactions?noClutter=1&' + directionQuery;
          }

          return axios({
            url: app.get('adamant address') + uri,
            method: 'get',
          })
            .then((response) => {
              if (response.status !== 200) {
                errorMessage = 'Response was unsuccessful';
              }
              if (response.data.success) {
                response.data.transactions.forEach((transaction) => {
                  if (indexOfById(transactionsList, transaction) < 0) {
                    transactionsList.push(transaction);
                  }
                });
              } else {
                errorMessage = response.data.error;
              }

              if (index === data.length - 1) {
                return (transactionsList.length > 0 || !errorMessage) ?
                  cb(null, transactionsList) :
                  error({
                    success: false,
                    error: errorMessage,
                  });
              }
            })
            .catch((err) => {
              errorMessage = err;
            });
        });
      },
      processTransactions,
    ], (err, result) => {
      if (err) {
        return error({
          success: false,
          error: err,
        });
      } else {
        return success({
          success: true,
          transactions: result,
        });
      }
    });
  };

  this.getTransactionsByBlock = function (query, error, success) {
    if (!query.blockId) {
      return error({
        success: false,
        error: 'Missing/Invalid blockId parameter',
      });
    }

    async.waterfall([
      (cb) => {
        return axios({
          url: app.get('adamant address') + '/api/transactions?blockId=' + query.blockId + '&orderBy=timestamp:desc' + '&offset=' + param(query.offset, 0) + '&limit=' + param(query.limit, 100),
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
              return cb(null, response.data.transactions);
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
      },
      processTransactions,
    ], function (err, result) {
      if (err) {
        return error({
          success: false,
          error: err,
        });
      } else {
        return success({
          success: true,
          transactions: result,
        });
      }
    });
  };

  // Private

  const self = this;
  const delegateCache = [];
  const exchange = app.exchange;
  const knowledge = app.knownAddresses;

  const param = function (p, d) {
    p = parseInt(p);

    if (isNaN(p) || p < 0) {
      return d;
    } else {
      return p;
    }
  };

  const concatenate = function (transactions, body) {
    transactions = transactions.concat(body.transactions);
    transactions.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return -1;
      } else if (a.timestamp < b.timestamp) {
        return 1;
      } else {
        return 0;
      }
    });

    let max = 10;
    if (transactions.length < max) {
      max = transactions.length;
    }

    return transactions.slice(0, 20);
  };

  const processTransaction = function (tx, cb) {
    // Gathering more information about transaction, we skip errors here
    async.waterfall([
      (waterCb) => {
        waterCb(null, knowledge.inTx(tx));
      },
      getSenderDelegate,
      getRecipientPublicKey,
      getRecipientDelegate,
    ], (err, result) => {
      return cb(null, result);
    });
  };

  const processTransactions = function (transactions, cb) {
    const tmpDelegateCache = [];

    // Gathering more information about transactions, we skip errors here
    async.eachSeries(transactions, (tx, seriesCb) => {
      async.waterfall([
        (waterCb) => {
          waterCb(null, knowledge.inTx(tx));
        },
        (result, waterCb) => {
          getSenderDelegate(result, waterCb, tmpDelegateCache);
        },
        (result, waterCb) => {
          getRecipientPublicKey(result, waterCb, tmpDelegateCache);
        },
        (result, waterCb) => {
          getRecipientDelegate(result, waterCb, tmpDelegateCache);
        },
      ], (err, result) => {
        seriesCb(null, result);
      });
    }, (err) => {
      return cb(null, transactions);
    });
  };

  const getDelegateFromCache = function (address, tmpDelegateCache) {
    // Checking global delegate cache
    if (delegateCache && delegateCache[address] !== undefined) {
      logger.debug('Using global cache for: ' + address);
      return delegateCache[address];
    }

    // Checking tmp delegate cache
    if (tmpDelegateCache && tmpDelegateCache[address] !== undefined) {
      logger.debug('Using tmp cache for: ' + address);
      return tmpDelegateCache[address];
    }

    return undefined;
  };

  const setDelegateToCache = function (delegate, tmpDelegateCache) {
    // Storing to global delegate cache
    if (delegateCache && !tmpDelegateCache && delegate && delegate.address && delegateCache[delegate.address] === undefined) {
      logger.debug('Storing global cache for: ' + delegate.address);
      delegateCache[delegate.address] = delegate;
      return true;
    }

    // Storing to tmp delegate cache
    if (tmpDelegateCache && delegate && tmpDelegateCache[delegate] === undefined) {
      logger.debug('Storing tmp cache for: ' + delegate);
      tmpDelegateCache[delegate] = null;
      return tmpDelegateCache;
    }

    return false;
  };

  const getSenderDelegate = function (transaction, cb, tmpDelegateCache) {
    if (!transaction.senderPublicKey) {
      transaction.senderDelegate = null;
      return cb(null, transaction);
    }

    const found = getDelegateFromCache(transaction.senderId, tmpDelegateCache);
    if (found !== undefined) {
      transaction.senderDelegate = found;
      return cb(null, transaction);
    }

    return axios({
      url: app.get('adamant address') + '/api/delegates/get?publicKey=' + transaction.senderPublicKey,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          transaction.senderDelegate = null;
          return cb(null, transaction);
        }
        if (response.data.success && response.data.delegate && response.data.delegate.address) {
          transaction.senderDelegate = response.data.delegate;
          setDelegateToCache(transaction.senderDelegate);
          return cb(null, transaction);
        } else {
          transaction.senderDelegate = null;
          setDelegateToCache(transaction.senderId, tmpDelegateCache);
          return cb(null, transaction);
        }
      })
      .catch((err) => {
        transaction.senderDelegate = null;
        return cb(null, transaction);
      });
  };

  const getRecipientPublicKey = function (transaction, cb, tmpDelegateCache) {
    if (!transaction.recipientId || transaction.type !== 0) {
      transaction.recipientPublicKey = null;
      return cb(null, transaction);
    }

    const found = getDelegateFromCache(transaction.recipientId, tmpDelegateCache);
    if (found !== undefined) {
      transaction.recipientPublicKey = (found ? found.publicKey : null);
      transaction.recipientDelegate = found;
      return cb(null, transaction);
    }

    return axios({
      url: app.get('adamant address') + '/api/accounts/getPublicKey?address=' + transaction.recipientId,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          transaction.recipientPublicKey = null;
          return cb(null, transaction);
        }
        if (response.data.success && response.data.publicKey) {
          transaction.recipientPublicKey = response.data.publicKey;
          return cb(null, transaction);
        } else {
          transaction.recipientPublicKey = null;
          return cb(null, transaction);
        }
      })
      .catch((err) => {
        transaction.recipientPublicKey = null;
        return cb(null, transaction);
      });
  };

  const getRecipientDelegate = function (transaction, cb, tmpDelegateCache) {
    if (!transaction.recipientPublicKey) {
      transaction.recipientDelegate = null;
      return cb(null, transaction);
    }

    return axios({
      url: app.get('adamant address') + '/api/delegates/get?publicKey=' + transaction.recipientPublicKey,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          transaction.recipientDelegate = null;
          return cb(null, transaction);
        }
        if (response.data.success && response.data.delegate && response.data.delegate.address) {
          transaction.recipientDelegate = response.data.delegate;
          setDelegateToCache(transaction.recipientDelegate);
          return cb(null, transaction);
        } else {
          transaction.recipientDelegate = null;
          setDelegateToCache(transaction.recipientId, tmpDelegateCache);
          return cb(null, transaction);
        }
      })
      .catch((err) => {
        transaction.recipientDelegate = null;
        return cb(null, transaction);
      });
  };
};
