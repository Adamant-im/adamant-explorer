var request = require('request'),
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
                return success({
                    success : true,
                    balance : body.balance || 0,
                    unconfirmedBalance : body.balance || 0,
                    address : address,
                    usd : exchange.convertXCRTOUSD(body.balance)
                });
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

    var exchange = app.exchange;

    var validAddress = function (address) {
        return (
            typeof address === 'string'
                && address.match(/[0-9]{18,20}C/)
        );
    }
}
