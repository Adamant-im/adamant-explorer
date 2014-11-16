var request = require('request'),
    async = require('async');

module.exports = function (app) {
    app.get("/api/getAccount", function (req, res, next) {
        var address = req.query.address;

        if (!address) {
            return res.json({ success : false });
        }

        request.get({
            url : req.crypti + "/api/getBalance?address=" + address,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return res.json({ success : false });
            } else {
                req.json = { success : true, balance : body.balance || 0, unconfirmedBalance : body.balance || 0, address : address, usd : req.convertXCR(body.balance) };
                return next();
            }
        });
    });

    app.get("/api/getTopAccounts", function (req, res, next) {
        if (app.topAccounts) {
            async.forEach(app.topAccounts, function (a, cb) {
                a.usd = req.convertXCR(a.balance);
                cb();
            }, function () {
                return res.json({ success : true, accounts : app.topAccounts });
            });
        } else {
            return res.json({ success : false });
        }
    });
}