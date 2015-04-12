var delegates = require('./delegates'),
    request = require('request'),
    _ = require('underscore');

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

    this.lastBlocks = function (p, error, success) {
        this.getBlocksCount(
            function (data) { return error({ success : false }); },
            function (data) {
                if (data.success == true) {
                    var height = data.count;

                    request.get({
                        url : app.get("crypti address") + "/api/blocks?orderBy=height:desc&limit=20&offset=" + page(p),
                        json : true
                    }, function (err, response, body) {
                        if (err || response.statusCode != 200) {
                            return error({ success : false });
                        } else if (body.success == true) {
                            return success({
                                success: true,
                                blocks: blocks(body),
                                pagination : pagination(p, height)
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

    this.getBlock = function (blockId, error, success) {
        if (!blockId) {
            return error({ success : false });
        }
        this.getBlocksCount(
            function (data) { return error({ success : false }); },
            function (data) {
                if (data.success == false) {
                    return error({ success : false });
                } else {
                    var actualHeight = data.count;
                }
                request.get({
                    url : app.get("crypti address") + "/api/blocks/get?id=" + blockId,
                    json : true
                }, function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        return error({ success : false });
                    } else if (body.success == true) {
                        return getDelegate(block(body, actualHeight), success);
                    } else {
                        return error({ success : false });
                    }
                });
            }
        );
    }

    // Private

    var api = {
        delegates : new delegates(app)
    }

    var page = function (p) {
        p = parseInt(p);

        if (isNaN(p) || p < 0) {
            return p = 0;
        } else {
            return p;
        }
    }

    var fixedPoint = app.get("fixed point");
    var exchange   = app.exchange;

    var block = function (body, actualHeight) {
        var b = body.block;

        b.confirmations = actualHeight - b.height + 1;
        b.payloadHash = new Buffer(b.payloadHash).toString('hex');
        b.totalAmount /= fixedPoint;
        b.totalFee /= fixedPoint;
        b.usd = exchange.convertXCRTOUSD(b.totalAmount + b.totalFee);

        return body;
    }

    var getDelegate = function (body, cb) {
        var b = body.block;

        api.delegates.getDelegate(
            b.generatorPublicKey,
            function (res) {
                return cb(body);
            },
            function (res) {
                b.delegate = res.delegate;
                return cb(body);
            }
        );
    }

    var blocks = function (body) {
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

    var pagination = function (p, height) {
        var pagination = {};
        pagination.currentPage = parseInt(p / 20) + 1;

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
