'use strict';

var request = require('request'),
    _ = require('underscore'),
    async = require('async');

module.exports = function (app) {
    this.getBlockHeight = function (error, success) {
        request.get({
            url: app.get('lisk address') + '/api/blocks/getHeight',
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                return success({ success :true, height : body.height });
            } else {
                return error({ success : false, error : body.error });
            }
        });
    };

    this.getBlockByHeight = function (height, error, success) {
        request.get({
            url: app.get('lisk address') + '/api/blocks?height=' + height,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true && body.count !== 0) {
                return success({ success :true, id: body.blocks[0].id, height : body.blocks[0].height });
            } else {
                return error({ success : false, error : 'No block at specified height' });
            }
        });
    };


    function Blocks () {
        this.offset = function (n) {
            n = parseInt(n);

            if (isNaN(n) || n < 0) {
                return 0;
            } else {
                return n;
            }
        };

        this.getDelegate = function (result, cb) {
            var block = result;

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
                return cb(null, result);
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
                    height : b.height,
                    delegate : b.delegate
                };
            });
        };

        this.pagination = function (n, height) {
            var pagination = {};
            pagination.currentPage = parseInt(n / 20) + 1;

            var totalPages = parseInt(height / 20);
            if (totalPages < height / 20) { totalPages++; }

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
        var blocks = new Blocks();

        this.getBlockHeight(
            function (data) { return error({ success : false, error : data.error }); },
            function (data) {
                if (data.success === true) {
                    request.get({
                        url : app.get('lisk address') + '/api/blocks?orderBy=height:desc&limit=20&offset=' + blocks.offset(n),
                        json : true
                    }, function (err, response, body) {
                        if (err || response.statusCode !== 200) {
                            return error({ success : false, error : (err || 'Response was unsuccessful') });
                        } else if (body.success === true) {
                            async.forEach(body.blocks, function (b, cb) {
                                blocks.getDelegate(b, cb);
                            }, function () {
                                return success({
                                    success: true,
                                    blocks: blocks.map(body),
                                    pagination : blocks.pagination(n, data.height)
                                });
                            });
                        } else {
                            return error({ success : false, error : body.error });
                        }
                    });
                } else {
                    return error({ success : false, error : data.error });
                }
            }
        );
    };

    function Block () {
        this.getBlock = function (blockId, height, cb) {
            request.get({
                url : app.get('lisk address') + '/api/blocks/get?id=' + blockId,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    return cb(err || 'Response was unsuccessful');
                } else if (body.success === true) {
                    return cb(null, makeBody(body, height));
                } else {
                    return cb(body.error);
                }
            });
        };

        this.getDelegate = function (result, cb) {
            var block = result.block;

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
                return cb(null, result);
            });
        };

        // Private

        var makeBody = function (body, height) {
            var b = body.block;

            b.confirmations = height - b.height + 1;
            b.payloadHash = new Buffer(b.payloadHash).toString('hex');

            return body;
        };
    }

    this.getBlock = function (blockId, error, success) {
        var block = new Block();

        if (!blockId) {
            return error({ success : false, error : 'Missing/Invalid blockId parameter' });
        }
        this.getBlockHeight(
            function (data) { return error({ success : false, error : data.error }); },
            function (data) {
                if (data.success === false) {
                    return error({ success : false, error : data.error });
                } else {
                    async.waterfall([
                        function (cb) {
                            block.getBlock(blockId, data.height, cb);
                        },
                        function (result, cb) {
                            block.getDelegate(result, cb);
                        },
                    ], function (err, result) {
                        if (err) {
                            return error({ success : false, error : err });
                        } else {
                            return success(result);
                        }
                    });
                }
            }
        );
    };

    this.getHeight = function (height, error, success) {
        var block = new Block();

        if (!height) {
            return error({ success : false, error : 'Missing/Invalid height parameter' });
        }
        this.getBlockByHeight(height,
            function (data) { return error({ success : false, error : data.error }); },
            function (data) {
                if (data.success === false) {
                    return error({ success : false, error : data.error });
                } else {
                    async.waterfall([
                        function (cb) {
                            block.getBlock(data.id, data.height, cb);
                        },
                        function (result, cb) {
                            block.getDelegate(result, cb);
                        },
                    ], function (err, result) {
                        if (err) {
                            return error({ success : false, error : err });
                        } else {
                            return success(result);
                        }
                    });
                }
            }
        );
    };

    this.getBlockStatus = function (error, success) {
        request.get({
            url : app.get('lisk address') + '/api/blocks/getStatus',
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode !== 200) {
                return error({ success : false, error : (err || 'Response was unsuccessful') });
            } else if (body.success === true) {
                return success(body);
            } else {
                return error({ success : false, error : body.error });
            }
        });
    };

    // Private

    var exchange   = app.exchange;
};
