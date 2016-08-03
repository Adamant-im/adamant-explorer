'use strict';

var request = require('request'),
    _ = require('underscore'),
    async = require('async');

module.exports = function (app) {
    function Active () {
        this.getActive = function (cb) {
            request.get({
                url : app.get('lisk address') + '/api/delegates/?orderBy=rate:asc&limit=101',
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    body.delegates = parseDelegates(body.delegates);
                    return cb(null, body);
                } else {
                    return cb(body.error);
                }
            });
        };

        this.getForged = function (delegate, cb) {
            request.get({
                url : app.get('lisk address') + '/api/delegates/forging/getForgedByAccount?generatorPublicKey=' + delegate.publicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    delegate.forged = body.forged;
                    return cb();
                } else {
                    delegate.forged = 0;
                    return cb();
                }
            });
        };
    }

    this.getActive = function (error, success) {
        var delegates = new Active();

        async.waterfall([
            function (cb) {
                delegates.getActive(cb);
            },
            function (result, cb) {
                async.each(result.delegates, function (delegate, callback) {
                    delegates.getForged(delegate, callback);
                }, function (err) {
                    if (err) {
                        return cb(err);
                    } else {
                        return cb(null, result);
                    }
                });
            },
        ], function (err, result) {
            if (err) {
                return error({ success : false, error : err });
            } else {
                return success(result);
            }
        });
    };

    function Standby (n) {
        this.limit        = 20;
        this.offset       = parseInt(n);
        this.actualOffset = (isNaN(this.offset)) ? 101 : this.offset + 101;

        this.pagination = function (totalCount) {
            var pagination = {};
            pagination.currentPage = parseInt(this.offset / this.limit) + 1;

            var totalPages = parseInt(totalCount / this.limit);
            if (totalPages < totalCount / this.limit) { totalPages++; }

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
        var delegates = new Standby(n);

        request.get({
            url : app.get('lisk address') + '/api/delegates/?orderBy=rate:asc' + '&limit='  + delegates.limit + '&offset=' + delegates.actualOffset,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                body.delegates  = parseDelegates(body.delegates);
                body.totalCount = (body.totalCount - 101);
                body.pagination = delegates.pagination(body.totalCount);
                return success(body);
            } else {
                return error({ success : false, error : body.error });
            }
        });
    };

    function Registrations () {
        this.getTransactions = function (cb) {
            request.get({
                url : app.get('lisk address') + '/api/transactions/?orderBy=timestamp:desc&limit=5&type=2',
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    return cb(null, body.transactions);
                } else {
                    return cb(body.error);
                }
            });
        };

        this.getDelegate = function (tx, cb) {
            request.get({
                url : app.get('lisk address') + '/api/delegates/get?publicKey=' + tx.senderPublicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    tx.delegate = body.delegate;
                    return cb();
                } else {
                    return cb(body.error);
                }
            });
        };
    }

    this.getLatestRegistrations = function (error, success) {
        var registrations = new Registrations();

        async.waterfall([
            function (cb) {
                registrations.getTransactions(cb);
            },
            function (transactions, cb) {
                async.each(transactions, function (tx, callback) {
                    registrations.getDelegate(tx, callback);
                }, function (err) {
                    if (err) {
                        return cb(err);
                    } else {
                        return cb(null, transactions);
                    }
                });
            },
        ], function (err, transactions) {
            if (err) {
                return error({ success : false, error : err });
            } else {
                return success({ success : true, transactions : transactions });
            }
        });
    };

    this.getLatestVotes = function (error, success) {
        request.get({
            url : app.get('lisk address') + '/api/transactions/?orderBy=timestamp:desc&limit=5&type=3',
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                return success({ success : true, transactions : body.transactions });
            } else {
                return error({ success : false, error : body.error });
            }
        });
    };

    function LastBlock () {
        this.getBlock = function (cb) {
            request.get({
                url : app.get('lisk address') + '/api/blocks?&orderBy=height:desc&limit=1',
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true && _.size(body.blocks) === 1) {
                    return cb(null, body.blocks[0]);
                } else {
                    return cb(body.error);
                }
            });
        };

        this.getDelegate = function (block, cb) {
            request.get({
                url : app.get('lisk address') + '/api/delegates/get?publicKey=' + block.generatorPublicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    block.delegate = body.delegate;
                } else {
                    block.delegate = null;
                }
                return cb(null, block);
            });
        };
    }

    this.getLastBlock = function (error, success) {
        var lastBlock = new LastBlock();

        async.waterfall([
            function (cb) {
                lastBlock.getBlock(cb);
            },
            function (result, cb) {
                lastBlock.getDelegate(result, cb);
            },
        ], function (err, result) {
            if (err) {
                return error({ success : false, error : err });
            } else {
                return success({ success : true, block : result });
            }
        });
    };

    this.getLastBlocks = function (params, error, success) {
        if (!params.publicKey) {
            return error({ success : false, error : 'Missing/Invalid publicKey parameter' });
        }
        if (isNaN(parseInt(params.limit)) || params.limit > 20) {
            params.limit = 20;
        }
        request.get({
            url : app.get('lisk address') + '/api/blocks?orderBy=height:desc&generatorPublicKey=' + params.publicKey + '&limit=' + params.limit,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : err });
            } else {
                body.blocks = _.isArray(body.blocks) ? body.blocks : [];
                return success({ success : true, blocks : body.blocks });
            }
        });
    };

    var parseDelegates = function (delegates) {
        _.each(delegates, function (d) {
            d.productivity = Math.abs(parseFloat(d.productivity)) || 0.0;
        });

        return delegates;
    };
};
