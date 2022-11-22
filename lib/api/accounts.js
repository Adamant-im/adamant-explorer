'use strict';

const axios = require('axios');
const _ = require('underscore');
const async = require('async');

module.exports = function (app) {
  function Account() {
    this.validAddress = function (address) {
      return (
        typeof address === 'string' && address.match(/^[U|u][0-9]{1,21}$/g)
      );
    };

    this.validPublicKey = function (publicKey) {
      return (
        typeof publicKey === 'string' &&
        publicKey.match(/^([A-Fa-f0-9]{2}){32}$/g)
      );
    };

    this.getAccountByAddress = function (address, cb) {
      return axios({
        url: app.get('lisk address') + '/api/accounts?address=' + address,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            const account = response.data.account;
            account.knowledge = knowledge.inAccount(account);
            return cb(null, account);
          } else {
            return cb(response.data.err);
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getAccountByPublicKey = function (publicKey, cb) {
      return axios({
        url: app.get('lisk address') + '/api/accounts?publicKey=' + publicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            const account = response.data.account;
            account.knowledge = knowledge.inAccount(account);
            return cb(null, account);
          } else {
            return cb(response.data.error);
          }
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getDelegate = function (account, cb) {
      if (!account.publicKey) {
        return cb(null, account);
      }

      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/get?publicKey=' +
          account.publicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            account.delegate = response.data.delegate;
          } else {
            account.delegate = null;
          }
          return cb(null, account);
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getVotes = function (account, cb) {
      if (!account.address) {
        return cb(null, account);
      }

      return axios({
        url:
          app.get('lisk address') +
          '/api/accounts/delegates/?address=' +
          account.address,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            account.votes =
              response.data.delegates !== undefined &&
              response.data.delegates !== null &&
              response.data.delegates.length > 0
                ? response.data.delegates
                : null;
            _.each(account.votes, function (d) {
              d.knowledge = knowledge.inAccount(d);
            });
          } else {
            account.votes = null;
          }
          return cb(null, account);
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getVoters = function (account, cb) {
      if (!account.publicKey) {
        return cb(null, account);
      }

      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/voters?publicKey=' +
          account.publicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            account.voters =
              response.data.accounts !== undefined &&
              response.data.accounts !== null &&
              response.data.accounts.length > 0
                ? response.data.accounts
                : null;
            _.each(account.voters, function (d) {
              d.knowledge = knowledge.inAccount(d);
            });
          } else {
            account.voters = null;
          }
          return cb(null, account);
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getIncomingTxsCnt = function (account, cb) {
      if (!account.address) {
        return cb(null, account);
      }

      return axios({
        url:
          app.get('lisk address') +
          '/api/transactions?recipientId=' +
          account.address +
          '&limit=1',
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            account.incoming_cnt = response.data.count;
          } else {
            account.incoming_cnt = 0;
          }
          return cb(null, account);
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getOutgoingTxsCnt = function (account, cb) {
      if (!account.address) {
        return cb(null, account);
      }

      return axios({
        url:
          app.get('lisk address') +
          '/api/transactions?senderId=' +
          account.address +
          '&limit=1',
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            account.outgoing_cnt = response.data.count;
          } else {
            account.outgoing_cnt = 0;
          }
          return cb(null, account);
        })
        .catch((err) => {
          return cb(err);
        });
    };

    this.getForged = function (account, cb) {
      if (!account.delegate) {
        return cb(null, account);
      }

      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/forging/getForgedByAccount?generatorPublicKey=' +
          account.publicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            account.delegate.forged = response.data.forged;
          } else {
            account.delegate.forged = 0;
          }
          return cb(null, account);
        })
        .catch((err) => {
          return cb(err);
        });
    };
  }

  this.getAccount = function (params, error, success) {
    const account = new Account();

    if (params.address && !account.validAddress(params.address)) {
      return error({
        success: false,
        error: 'Missing/Invalid address parameter',
      });
    }

    if (params.publicKey && !account.validPublicKey(params.publicKey)) {
      return error({
        success: false,
        error: 'Missing/Invalid publicKey parameter',
      });
    }

    async.waterfall(
      [
        (cb) => {
          if (params.address) {
            account.getAccountByAddress(params.address, cb);
          } else if (params.publicKey) {
            account.getAccountByPublicKey(params.publicKey, cb);
          } else {
            cb('Missing/Invalid address or publicKey parameter');
          }
        },
        (result, cb) => {
          account.getDelegate(result, cb);
        },
        (result, cb) => {
          account.getForged(result, cb);
        },
        (result, cb) => {
          account.getVotes(result, cb);
        },
        (result, cb) => {
          account.getVoters(result, cb);
        },
        (result, cb) => {
          account.getIncomingTxsCnt(result, cb);
        },
        (result, cb) => {
          account.getOutgoingTxsCnt(result, cb);
        },
      ],
      (err, result) => {
        if (err) {
          return error({ success: false, error: err });
        } else {
          result.success = true;
          return success(result);
        }
      },
    );
  };

  function TopAccount() {
    this.getKnowledge = (account, cb) => {
      account.knowledge = knowledge.inAccount(account);

      if (!account.knowledge && account.publicKey) {
        return getDelegate(account, cb);
      } else {
        return cb(null, account);
      }
    };

    // Private

    const getDelegate = function (account, cb) {
      return axios({
        url:
          app.get('lisk address') +
          '/api/delegates/get?publicKey=' +
          account.publicKey,
        method: 'get',
      })
        .then((response) => {
          if (response.status !== 200) {
            return cb('Response was unsuccessful');
          }
          if (response.data.success) {
            account.knowledge = knowledge.inDelegate(response.data.delegate);
          } else {
            account.knowledge = null;
          }
          return cb(null, account);
        })
        .catch((err) => {
          return cb(err);
        });
    };
  }

  this.getTopAccounts = function (query, error, success) {
    const topAccount = new TopAccount();

    return axios({
      url:
        app.get('lisk address') +
        '/api/accounts/top?&offset=' +
        param(query.offset, 0) +
        '&limit=' +
        param(query.limit, 100),
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return error({
            success: 'Response was unsuccessful',
            error: error,
          });
        }
        if (response.data.success) {
          async.forEach(
            response.data.accounts,
            function (a, cb) {
              topAccount.getKnowledge(a, cb);
            },
            () => {
              return success({ success: true, accounts: response.data.accounts });
            },
          );
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

  const knowledge = app.knownAddresses;
  const exchange = app.exchange;

  const param = function (p, d) {
    p = parseInt(p);

    if (isNaN(p) || p < 0) {
      return d;
    } else {
      return p;
    }
  };
};
