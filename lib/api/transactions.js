'use strict';

var request = require('request'),
    _ = require('underscore'),
    async = require('async');

module.exports = function (app) {
    this.getTransaction = function (transactionId, error, success, url) {
        if (!url) {
            var confirmed = true;
            url = '/api/transactions/get?id=';
        }
        if (!transactionId) {
            return error({ success : false, error : 'Missing/Invalid transactionId parameter' });
        }
        request.get({
            url : app.get('lisk address') + url + transactionId,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                var transaction = knowledge.inTx(body.transaction);
                transaction.usd = exchange.LISKUSD(transaction.amount + transaction.fee);
                var t = new Transaction();

                if (transaction.votes) {
                    async.waterfall([
                        function (cb) {
                            if (transaction.votes.added.length) {
                                var added = [];
                                _.each(transaction.votes.added, function (vote) {
                                    added.push ({publicKey : vote});
                                });

                                async.forEach(added, function (add, cb) {
                                    t.getDelegate(add, cb);
                                }, function () {
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
                                var deleted = [];
                                _.each(result.votes.deleted, function (vote) {
                                    deleted.push ({publicKey : vote});
                                });

                                async.forEach(deleted, function (add, cb) {
                                    t.getDelegate(add, cb);
                                }, function () {
                                    result.votes.deleted = deleted;
                                    return cb(null, result);
                                });
                            } else {
                                result.votes.deleted = null;
                                return cb(null, result);
                            }
                        },
                    ], function (err, result) {
                        if (err) {
                            return error({ success : false, error : err });
                        } else {
                            return success({ success : true, transaction : result });
                        }
                    });
                } else {
                    return success({ success : true, transaction : transaction });
                }

            } else if (confirmed) {
                return this.getUnconfirmedTransaction(transactionId, error, success);
            } else {
                return error({ success : false, error : body.error });
            }
        }.bind(this));
    };

    function Transaction () {
        this.getDelegate = function (forger, cb) {
            request.get({
                url : app.get('lisk address') + '/api/delegates/get?publicKey=' + forger.publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    forger.delegate = body.delegate;
                } else {
                    forger.delegate = null;
                }
                return cb(null, forger);
            });
        };
    }

    this.getUnconfirmedTransaction = function (transactionId, error, success) {
        this.getTransaction(transactionId, error, success, '/api/transactions/unconfirmed/get?id=');
    };

    this.getUnconfirmedTransactions = function (error, success, transactions) {
        async.waterfall([
            function (cb) {
                request.get({
                    url : app.get('lisk address') + '/api/transactions/unconfirmed',
                    json : true
                }, function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return error({ success : false, error : (err || 'Response was unsuccessful') });
                    } else if (body.success === true) {
                        if (transactions) {
                            _.each(body.transactions, knowledge.inTx);
                            body.transactions = concatenate(transactions, body);
                            return cb(null, {transactions : body.transactions});
                        }
                    } else {
                        return error({ success : false, error : body.error });
                    }
                });
            },
            function (result, cb) {
                async.forEach(result.transactions, function (t, cb) {
                    getSenderDelegate(t, cb);
                }, function () {
                    return cb(null, result);
                });
            },
            function (result, cb) {
                async.forEach(result.transactions, function (t, cb) {
                    getRecipientPublicKey(t, cb);
                }, function () {
                    return cb(null, result);
                });
            },
            function (result, cb) {
                async.forEach(result.transactions, function (t, cb) {
                    getRecipientDelegate(t, cb);
                }, function () {
                    return cb(null, result);
                });
            },
        ], function (err, result) {
            if (err) {
                return error({ success : false, error : err });
            } else {
                return success({ success : true, transactions : result.transactions });
            }
        });
    };

    this.getLastTransactions = function (error, success) {
        request.get({
            url : app.get('lisk address') + '/api/transactions?orderBy=timestamp:desc&limit=20',
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                _.each(body.transactions, knowledge.inTx);
                return this.getUnconfirmedTransactions(error, success, body.transactions);
            } else {
                return error({ success : false, error : body.error });
            }
        }.bind(this));
    };

    this.getTransactionsByAddress = function (query, error, success) {
        if (!query.address) {
            return error({ success : false, erorr : 'Missing/Invalid address parameter' });
        }

        async.waterfall([
            function (cb) {
                request.get({
                    url : app.get('lisk address') + '/api/transactions?recipientId=' + query.address + '&senderId=' + query.address + '&orderBy=timestamp:desc' + '&offset=' + param(query.offset, 0) + '&limit=' + param(query.limit, 100),
                    json : true
                }, function (err, response, body) {
                    if (err || response.statusCode !== 200) {
                        return error({ success : false, error : (err || 'Response was unsuccessful') });
                    } else if (body.success === true) {
                        _.each(body.transactions, knowledge.inTx);
                        return cb(null, {transactions : body.transactions});
                    } else {
                        return error({ success : false, error : body.error });
                    }
                });
            },
            function (result, cb) {
                async.forEach(result.transactions, function (t, cb) {
                    getSenderDelegate(t, cb);
                }, function () {
                    return cb(null, result);
                });
            },
            function (result, cb) {
                async.forEach(result.transactions, function (t, cb) {
                    getRecipientPublicKey(t, cb);
                }, function () {
                    return cb(null, result);
                });
            },
            function (result, cb) {
                async.forEach(result.transactions, function (t, cb) {
                    getRecipientDelegate(t, cb);
                }, function () {
                    return cb(null, result);
                });
            },
        ], function (err, result) {
            if (err) {
                return error({ success : false, error : err });
            } else {
                return success({ success : true, transactions : result.transactions });
            }
        });
    };

    this.getTransactionsByBlock = function (query, error, success) {
        if (!query.blockId) {
            return error({ success : false, error : 'Missing/Invalid blockId parameter' });
        }
        request.get({
            url : app.get('lisk address') + '/api/transactions?blockId=' + query.blockId + '&orderBy=timestamp:desc' + '&offset=' + param(query.offset, 0) + '&limit=' + param(query.limit, 100),
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                _.each(body.transactions, knowledge.inTx);
                return success({ success : true, transactions : body.transactions });
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

    var concatenate = function (transactions, body) {
        transactions = transactions.concat(body.transactions);
        transactions.sort(function (a, b) {
            if (a.timestamp > b.timestamp) {
                return -1;
            } else if (a.timestamp < b.timestamp) {
                return 1;
            } else {
                return 0;
            }
        });

        var max = 10;
        if (transactions.length < max) {
            max = transactions.length;
        }

        return transactions.slice(0, 20);
    };

    var getSenderDelegate = function (result, cb) {
        var transaction = result;

        request.get({
            url : app.get('lisk address') + '/api/delegates/get?publicKey=' + transaction.senderPublicKey,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return cb(err || 'Response was unsuccessful');
            } else if (body.success === true) {
                transaction.senderDelegate = body.delegate;
            } else {
                transaction.senderDelegate = null;
            }
            return cb(null, result);
        });
    };

    var getRecipientPublicKey = function (result, cb) {
        var transaction = result;
        if (transaction.type !== 0) {
            return cb(null, result);
        }

        request.get({
            url : app.get('lisk address') + '/api/accounts/getPublicKey?address=' + transaction.recipientId,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return cb(err || 'Response was unsuccessful');
            } else if (body.success === true) {
                transaction.recipientPublicKey = body.publicKey;
            } else {
                transaction.recipientPublicKey = null;
            }
            return cb(null, result);
        });
    };

    var getRecipientDelegate = function (result, cb) {
        var transaction = result;

        request.get({
            url : app.get('lisk address') + '/api/delegates/get?publicKey=' + transaction.recipientPublicKey,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return cb(err || 'Response was unsuccessful');
            } else if (body.success === true) {
                transaction.recipientDelegate = body.delegate;
            } else {
                transaction.recipientDelegate = null;
            }
            return cb(null, result);
        });
    };

};
