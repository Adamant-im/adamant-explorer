var request = require('request'),
    _ = require('underscore'),
    async = require('async');

module.exports = function (app) {
    this.getBlocksCount = function (error, success) {
        request.get({
            url: app.get("crypti address") + "/api/blocks/getHeight",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return error({ success : false });
            } else if (body.success == true) {
                return success({ success : true, count : body.height });
            } else {
                return error({ success : false });
            }
        });
    }

    function Blocks () {
        this.offset = function (n) {
            n = parseInt(n);

            if (isNaN(n) || n < 0) {
                return n = 0;
            } else {
                return n;
            }
        }

        this.map = function (body) {
            return _.map(body.blocks, function (b) {
                return {
                    id: b.id,
                    timestamp: b.timestamp,
                    generator: b.generatorId,
                    totalAmount: b.totalAmount / fixedPoint,
                    totalFee: b.totalFee / fixedPoint,
                    transactionsCount: b.numberOfTransactions,
                    height : b.height
                };
            });
        }

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
        }
    }

    this.lastBlocks = function (n, error, success) {
        var blocks = new Blocks();

        this.getBlocksCount(
            function (data) { return error({ success : false }); },
            function (data) {
                if (data.success == true) {
                    request.get({
                        url : app.get("crypti address")
                            + "/api/blocks?orderBy=height:desc&limit=20&offset=" + blocks.offset(n),
                        json : true
                    }, function (err, response, body) {
                        if (err || response.statusCode != 200) {
                            return error({ success : false });
                        } else if (body.success == true) {
                            return success({
                                success: true,
                                blocks: blocks.map(body),
                                pagination : blocks.pagination(n, data.count)
                            });
                        } else {
                            return error({ success : false });
                        }
                    });
                } else {
                    return error({ success : false });
                }
            }
        );
    }

    function Block () {
        this.getBlock = function (blockId, height, cb) {
            request.get({
                url : app.get("crypti address") + "/api/blocks/get?id=" + blockId,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode != 200) {
                    return cb(err || "Response was unsuccessful");
                } else if (body.success == true) {
                    return cb(null, makeBody(body, height));
                } else {
                    return cb(body.error);
                }
            });
        }

        this.getDelegate = function (result, cb) {
            var block = result.block;

            request.get({
                url : app.get("crypti address")
                    + "/api/delegates/get?publicKey=" + block.generatorPublicKey,
                json : true
            }, function (err, response, body) {
                if (err || response.statusCode != 200) {
                    return cb(err || "Response was unsuccessful");
                } else if (body.success == true) {
                    block.delegate = body.delegate;
                } else {
                    block.delegate = null;
                }
                return cb(null, result);
            });
        }

        // Private

        var makeBody = function (body, height) {
            var b = body.block;

            b.confirmations = height - b.height + 1;
            b.payloadHash = new Buffer(b.payloadHash).toString('hex');
            b.totalAmount /= fixedPoint;
            b.totalFee /= fixedPoint;
            b.usd = exchange.convertXCRTOUSD(b.totalAmount + b.totalFee);

            return body;
        }
    }

    this.getBlock = function (blockId, error, success) {
        var block = new Block();

        if (!blockId) {
            return error({ success : false });
        }
        this.getBlocksCount(
            function (data) { return error({ success : false }); },
            function (data) {
                if (data.success == false) {
                    return error({ success : false });
                } else {
                    async.waterfall([
                        function (cb) {
                            block.getBlock(blockId, data.count, cb);
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
    }

    // Private

    var fixedPoint = app.get("fixed point");
    var exchange   = app.exchange;
}
