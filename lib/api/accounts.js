var delegates = require('./delegates'),
    request = require('request'),
    async = require('async');

module.exports = function (app) {
    this.getAccount = function (address, error, success) {
        if (!validAddress(address)) {
            return error({ success : false });
        }
        request.get({
            url : app.get("crypti address") + "/api/accounts/getBalance?address=" + address,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return error({ success : false });
            } else {
                getPublicKey(
                    address,
                    function (res) {
                        return error({ success : false });
                    },
                    function (res) {
                        var account = {
                            success : true,
                            publicKey : res.publicKey,
                            balance : body.balance || 0,
                            unconfirmedBalance : body.balance || 0,
                            address : address,
                            usd : exchange.convertXCRTOUSD(body.balance)
                        };

                        return getDelegate(account, success);
                    }
                );
            }
        });
    }

    this.getTopAccounts = function (error, success) {
        if (app.topAccounts) {
            async.forEach(app.topAccounts, function (a, cb) {
                a.usd = exchange.convertXCRTOUSD(a.balance);
                cb();
            }, function () {
                return success({ success : true, accounts: app.topAccounts });
            });
        } else {
            return error({ success : false });
        }
    }

    // Private

    var api = {
        delegates : new delegates(app)
    }

    var exchange = app.exchange;

    var validAddress = function (address) {
        return (
            typeof address === 'string'
                && address.match(/[0-9]{18,20}C/)
        );
    }

    var getPublicKey = function (address, error, success) {
        if (!validAddress(address)) {
            return error({ success : false });
        }
        request.get({
            url : app.get("crypti address") + "/api/accounts/getPublicKey?address=" + address,
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return error({ success : false });
            } else {
                return success({ success : true, publicKey : body.publicKey });
            }
        });
    }

    var getDelegate = function (account, cb) {
        api.delegates.getDelegate(
            account.publicKey,
            function (res) {
                return cb(account);
            },
            function (res) {
                account.delegate = res.delegate;
                return getForged(account, cb);
            }
        );
    }

    var getForged = function (account, cb) {
        api.delegates.getForged(
            account.publicKey,
            function (res) {
                return cb(account);
            },
            function (res) {
                if (account.delegate) {
                    account.delegate.fees = res.fees;
                }
                return cb(account);
            }
        );
    }
}
