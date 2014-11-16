var request = require('request'),
    _ = require('underscore');

module.exports = function (app) {
    app.get("/api/getTransaction", function (req, res, next) {
        var transactionId = req.query.transactionId;

        if (transactionId == null) {
            return res.json({ success : false });
        }

        request.get({
            url : req.crypti + "/api/getTransaction?transactionId=" + transactionId,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.status == "OK" && body.success == true) {
                    var transaction  = body.transaction;
                    transaction.usd = req.convertXCR(transaction.amount + transaction.fee);
                    req.json = { success : true, transaction : body.transaction };
                    return next();
                } else {
                    return res.json({ success : false });
                }
            }
        });
    });

    app.get("/api/getUnconfirmedTransactions", function (req, res, next) {
        request.get({
            url : req.crypti + "/api/getUnconfirmedTransactions",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.status == "OK" && body.success == true) {
                    req.json = { success : true, transactions : body.transactions };
                    return next();
                } else {
                    return res.json({ success : false });
                }
            }
        });
    });

    app.get("/api/getLastTransactions", function (req, res, next) {
        request.get({
            url : req.crypti + "/api/getLastTransactions?orderDesc=true",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.status == "OK" && body.success == true) {
                    var transactions = body.transactions;
                    request.get({
                        url : req.crypti + "/api/getUnconfirmedTransactions",
                        json : true
                    }, function (err, response, body) {
                        if (err || response.statusCode != 200) {
                            return res.json({ success : false });
                        } else {
                            if (body.status == "OK" && body.success == true) {
                                transactions = transactions.concat(body.transactions);
                                transactions.sort(function (a, b) {
                                    if (a.timestamp > b.timestamp)
                                        return -1;
                                    if (a.timestamp < b.timestamp)
                                        return 1;
                                    return 0;
                                });

                                var max = 10;

                                if (transactions.length < max) {
                                    max = transactions.length;
                                }

                                transactions.slice(0, 20);
                                req.json = { success : true, transactions : transactions };
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

    app.get("/api/getTransactionsByAddress", function (req, res, next) {
        var address = req.query.address,
            limit = req.query.limit || 20,
            offset = req.query.offset || 0;

        limit = parseInt(limit);

        if (isNaN(limit)) {
            limit = 20;
        } else if (limit <= 0) {
            return res.json({ success : false });
        }

        offset = parseInt(offset);

        if (isNaN(offset)) {
            offset = 0;
        } else if (offset < 0) {
            return res.json({ success : false });
        }

        if (address == null) {
            return res.json({ success : false });
        }

        request.get({
            url : req.crypti + "/api/getAddressTransactions?address=" + address + "&descOrder=true",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.status == "OK" && body.success == true) {
                    var withoffset = body.transactions;
                    req.json = { success : true, transactions : body.transactions };
                    return next();
                } else {
                    return res.json({ success : false });
                }
            }
        });
    });
}