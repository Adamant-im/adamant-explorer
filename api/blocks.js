var request = require('request'),
    _ = require('underscore');

module.exports = function (app) {
    app.get("/api/getBlocksCount", function (req, res, next) {
        request.get({
            url: req.crypti + "/api/blocks/getHeight",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.success == true) {
                    req.json = { success : true, count : body.height };
                    return next();
                } else {
                    return res.json({ success : false });
                }
            }
        });
    });

    app.get("/api/lastBlocks", function (req, res, next) {
        var n = req.query.n || 0;

        n = parseInt(n);

        if (isNaN(n))
        {
            n = 0;
        } else if (n < 0) {
            n = 0;
        }

        request.get({
            url: req.crypti + "/api/blocks/getHeight",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.success == true) {
                    var height = body.height;

                    request.get({
                        url : req.crypti + "/api/blocks?orderBy=height:desc&limit=20&offset=" + n,
                        json : true
                    }, function (err, response, body) {
                        if (err || response.statusCode != 200) {
                            console.log(err);
                            return res.json({ success : false });
                        } else {
                            if (body.success == true) {
                                var blocks = _.map(body.blocks, function (b) {
                                    return { id: b.id, timestamp: b.timestamp, generator: b.generatorId, totalAmount: b.totalAmount / req.fixedPoint, totalFee: b.totalFee / req.fixedPoint, transactionsCount: b.numberOfTransactions, height : b.height };
                                });

                                var totalPages = parseInt(height / 20);

                                if (totalPages < height / 20) {
                                    totalPages++;
                                }

                                var pagination = {};
                                pagination.currentPage = parseInt(n / 20) + 1;

                                if (pagination.currentPage < totalPages) {
                                    pagination.before = true;
                                    pagination.previousPage = pagination.currentPage + 1;
                                }

                                if (pagination.currentPage > 0) {
                                    pagination.more = true;
                                    pagination.nextPage = pagination.currentPage - 1;
                                }

                                req.json = { success: true, blocks: blocks, pagination : pagination };
                                return next();
                            } else {
                                return res.json({ success : false });
                            }
                        }
                    });
                } else {
                    return res.json({ success : false });
                }
            }
        });
    });

    app.get("/api/getBlock", function (req, res, next) {
        var blockId = req.query.blockId;

        if (!blockId) {
            return res.json({ success : false });
        }

        request.get({
            url: req.crypti + "/api/blocks/getHeight",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.success == true) {
                    var actualHeight = body.height;
                    request.get({
                        url : req.crypti + "/api/blocks/get?id=" + blockId,
                        json : true
                    }, function (err, response, body) {
                        if (err || response.statusCode != 200) {
                            return res.json({ success : false });
                        } else {
                            if (body.success == true) {
                                var block = body.block;
                                block.confirmations = actualHeight - block.height + 1;
                                block.payloadHash = new Buffer(block.payloadHash).toString('hex');
                                block.totalAmount /= req.fixedPoint;
                                block.totalFee /= req.fixedPoint;
                                block.usd = req.convertXCR(block.totalAmount + block.totalFee);

                                req.json = { success : true, block : body.block };
                                return next();
                            } else {
                                return res.json({ success : false });
                            }
                        }
                    });
                } else {
                    return res.json({ success : false });
                }
            }
        });

    });
}
