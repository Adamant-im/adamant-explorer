'use strict';

var request = require('request'),
    _ = require('underscore'),
    async = require('async'),
    logger = require('../../utils/logger');

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

    function Votes () {
        this.getVotes = function (cb) {
            request.get({
                url : app.get('lisk address') + '/api/transactions/?orderBy=timestamp:desc&limit=5&type=3',
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
                    tx.delegate = null;
                    return cb();
                } else if (body.success === true) {
                    tx.delegate = body.delegate;
                    return cb();
                } else {
                    tx.delegate = null;
                    return cb();
                }
            });
        };
    }

    this.getLatestVotes = function (error, success) {
        var votes = new Votes();

        async.waterfall([
            function (cb) {
                votes.getVotes(cb);
            },
            function (transactions, cb) {
                async.each(transactions, function (tx, callback) {
                    votes.getDelegate(tx, callback);
                }, function (err) {
                    return cb(null, transactions);
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

    this.getNextForgers = function (error, success) {
        request.get({
            url : app.get('lisk address') + '/api/delegates/getNextForgers?limit=101',
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                return success({ success : true, delegates : body.delegates });
            } else {
                return error({ success : false, error : body.error });
            }
        });
    };

    this.getDelegateProposals = function (error, success) {
            var offset = 0,
                limit  = 25,
                nextPage = false,
                url = 'https://forum.lisk.io/viewforum.php?f=48&start=',
                nextPageRegex = /<li class="next"><a href.+? rel="next" role="button">/m,
                proposalRegex = /<a href="\.\/viewtopic\.php\?f=48&amp;t=(\d+)&amp;sid=.+?" class="topictitle">(.+?)\s+(?:[-–](?:\s*rank)?\s*#\s*\d+\s*)?.*?[-–]\s+(.+?)<\/a>/mgi,
                result = [];

            async.doUntil(
                function (next) {
                    logger.info ('Parsing delegate proposals: ' + url + offset);
                    request.get({
                        url: url + offset,
                        json : false
                    }, function (err, resp, body) {
                        if (err || resp.statusCode !== 200) {
                            return next(err || 'Response was unsuccessful');
                        }

                        // Parse delegate proposal topics titles
                        var m;
                        do {
                            m = proposalRegex.exec(body);
                            if (m) {
                                result.push ({topic: m[1], name: m[2].toLowerCase(), description: _.unescape (m[3])});
                            }
                        } while (m);

                        // Continue if there is next page
                        nextPage = nextPageRegex.exec (body);
                        return next();
                    });
                },
                function () {
                    offset += limit;
                    return !nextPage;
                },
                function (err) {
                    if (err) {
                        error ({ success: false, error: err || 'Unable to parse delegate proposals' });
                    } else {
                        success ({ success: true, proposals: result, count: result.length });
                    }
                }
            );
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

    this.getSearch = function (params, error, success) {
           if (!params || !params.match(/^(?![0-9]{1,21}[L]$)[0-9a-z.]+/i)) {
                return error({ success : false, error : 'Missing/Invalid username parameter' });
            }
            request.get({
                url : app.get('lisk address') + '/api/delegates/search?q=' + params + '&limit=1',
                json : true
            }, function (err, response, body) {
            if (err || response.statusCode !== 200 || body.error) {
                return error({ success : false, error : (body.error ? body.error : err) });
            } else {
                if (!body.delegates || !body.delegates[0]) {
                    return error({ success : false, error : 'Delegate not found' });
                }
                return success({ success : true, address : body.delegates[0].address });
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
