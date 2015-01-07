var request = require('request');

module.exports = function (app) {
    app.get("/api/version", function (req, res) {
        return res.json({ version : 0.1 });
    });

    app.get("/api/getFee", function (req, res, next) {
        request.get({
            url : req.crypti + "/api/blocks/getFee",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                if (body.success == true) {
                    req.json = { success : true, feePercent : body.fee.toFixed(4) };
                    return next();
                } else {
                    return res.json({ success : false });
                }
            }
        });
    });

    app.get("/api/getXCRCourse", function (req, res, next) {
        if (app.bterXcr) {
            return res.json({ success : true, xcr : app.bterXcr, usd : req.convertXCR(1) });
        } else {
            return res.json({ success : false });
        }
    });

    app.get("/api/search", function (req, res, next) {
        var id = req.query.id;

        if (!id) {
            return res.json({ success : false });
        }

        request.get({
            url : req.crypti + "/api/getBlock?blockId=" + id,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else if (body.status == "OK" && body.success == true && body.blocks.length > 0) {
                req.json = { success : true, type : "block", id : body.blocks[0].id };
                return next();
            } else {
                request.get({
                    url : req.crypti + "/api/getTransaction?transactionId=" + id,
                    json : true
                }, function (err, response, body) {
                    if (err || response.statusCode != 200) {
                        return res.json({ success : false });
                    } else if (body.status == "OK" && body.success == true && body.transaction) {
                        req.json = { success : true, type : "tx", id : body.transaction.id };
                        return next();
                    } else {
                        request.get({
                            url : req.crypti + "/api/getBalance?address=" + id,
                            json : true
                        }, function (err, response, body) {
                            if (err || response.statusCode != 200) {
                                return res.json({ success : false });
                            } else if (body.status == "OK" && body.success == true && body.balance) {
                                req.json = { success : true, type : "address", id : id };
                                return next();
                            } else {
                                req.json = { success : false, found :false };
                                return next();
                            }
                        });
                    }
                });
            }
        });
    });
}
