'use strict';

var request = require('request'),
    _ = require('underscore'),
    async = require('async');

module.exports = function (app) {
    function Account () {
        this.validAddress = function (address) {
            return (
                typeof address === 'string' && address.match(/^[U|u][0-9]{1,21}$/g)
            );
        };

        this.validPublicKey = function (publicKey) {
            return (
                typeof publicKey === 'string' && publicKey.match(/^([A-Fa-f0-9]{2}){32}$/g)
            );
        };

        this.getAccount = function (address, cb) {
            request.get({
                url : app.get('lisk address') + '/api/accounts?address=' + address,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    var account = body.account;
                    account.knowledge = knowledge.inAccount(account);
                    return cb(null, account);
                } else {
                    return cb(body.error);
                }
            });
        };

        this.getAccountByPublicKey = function (publicKey, cb) {
            request.get({
                url : app.get('lisk address') + '/api/accounts?publicKey=' + publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    var account = body.account;
                    account.knowledge = knowledge.inAccount(account);
                    return cb(null, account);
                } else {
                    return cb(body.error);
                }
            });
        };

        this.getDelegate = function (account, cb) {
            if (!account.publicKey) {
                return cb(null, account);
            }
            request.get({
                url : app.get('lisk address') + '/api/delegates/get?publicKey=' + account.publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    account.delegate = body.delegate;
                } else {
                    account.delegate = null;
                }
                return cb(null, account);
            });
        };

        this.getVotes = function (account, cb) {
            if (!account.address) {
                return cb(null, account);
            }
            request.get({
                url : app.get('lisk address') + '/api/accounts/delegates/?address=' + account.address,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    account.votes = (body.delegates !== undefined && body.delegates !== null && body.delegates.length > 0) ? body.delegates : null;
                    _.each(account.votes, function (d) {
                        d.knowledge = knowledge.inAccount(d);
                    });
                } else {
                    account.votes = null;
                }
                return cb(null, account);
            });
        };

        this.getVoters = function (account, cb) {
            if (!account.publicKey) {
                return cb(null, account);
            }
            request.get({
                url : app.get('lisk address') + '/api/delegates/voters?publicKey=' + account.publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    account.voters = (body.accounts !== undefined && body.accounts !== null && body.accounts.length > 0) ? body.accounts : null;
                    _.each(account.voters, function (d) {
                        d.knowledge = knowledge.inAccount(d);
                    });
                } else {
                    account.voters = null;
                }
                return cb(null, account);
            });
        };

        this.getIncomingTxsCnt = function (account, cb) {
            if (!account.address) {
                return cb(null, account);
            }

            request.get({
                url : app.get('lisk address') + '/api/transactions?recipientId=' + account.address + '&limit=1',
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    account.incoming_cnt = body.count;
                } else {
                    account.incoming_cnt = 0;
                }
                return cb(null, account);
            });
        };

        this.getOutgoingTxsCnt = function (account, cb) {
            if (!account.address) {
                return cb(null, account);
            }

            request.get({
                url : app.get('lisk address') + '/api/transactions?senderId=' + account.address + '&limit=1',
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    account.outgoing_cnt = body.count;
                } else {
                    account.outgoing_cnt = 0;
                }
                return cb(null, account);
            });
        };

        this.getForged = function (account, cb) {
            if (!account.delegate) {
                return cb(null, account);
            }
            request.get({
                url : app.get('lisk address') + '/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + account.publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    account.delegate.forged = body.forged;
                } else {
                    account.delegate.forged = 0;
                }
                return cb(null, account);
            });
        };
    }

    this.getAccount = function (params, error, success) {
        var account = new Account();

        if (params.address && !account.validAddress(params.address)) {
            return error({ success : false, error : 'Missing/Invalid address parameter' });
        }

        if (params.publicKey && !account.validPublicKey(params.publicKey)) {
            return error({ success : false, error : 'Missing/Invalid publicKey parameter' });
        }

        async.waterfall([
            function (cb) {
                if (params.address) {
                    account.getAccount(params.address, cb);
                } else if (params.publicKey) {
                    account.getAccountByPublicKey(params.publicKey, cb);
                } else {
                    cb('Missing/Invalid address or publicKey parameter');
                }
            },
            function (result, cb) {
                account.getDelegate(result, cb);
            },
            function (result, cb) {
                account.getForged(result, cb);
            },
            function (result, cb) {
                account.getVotes(result, cb);
            },
            function (result, cb) {
                account.getVoters(result, cb);
            },
            function (result, cb) {
                account.getIncomingTxsCnt(result, cb);
            },
            function (result, cb) {
                account.getOutgoingTxsCnt(result, cb);
            }
        ], function (err, result) {
            if (err) {
                return error({ success : false, error : err });
            } else {
                result.success = true;
                return success(result);
            }
        });
    };

    function TopAccount () {
        this.getKnowledge = function (account, cb) {
            account.knowledge = knowledge.inAccount(account);

            if (!account.knowledge && account.publicKey) {
                return getDelegate(account, cb);
            } else {
                return cb(null, account);
            }
        };

        // Private

        var getDelegate = function (account, cb) {
            request.get({
                url : app.get('lisk address') + '/api/delegates/get?publicKey=' + account.publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    account.knowledge = knowledge.inDelegate(body.delegate);
                } else {
                    account.knowledge = null;
                }
                return cb(null, account);
            });
        };
    }

    this.getTopAccounts = function (query, error, success) {
        var topAccount = new TopAccount();

        request.get({
            url : app.get('lisk address') + '/api/accounts/top?&offset=' + param(query.offset, 0) + '&limit=' + param(query.limit, 100),
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                async.forEach(body.accounts, function (a, cb) {
                    topAccount.getKnowledge(a, cb);
                }, function () {
                    return success({ success : true, accounts : body.accounts });
                });
            } else {
                return error({ success : false, error : body.error });
            }
        });
    };

    // Private

    var exchange = app.exchange,
        knowledge = app.knownAddresses;

    var param = function (p, d) {
        p = parseInt(p);

        if (isNaN(p) || p < 0) {
            return d;
        } else {
            return p;
        }
    };
};
