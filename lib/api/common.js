var request = require('request');

module.exports = function (app, api) {
    this.version = function () {
        return { version : app.get('version') };
    }

    this.getFee = function (error, success) {
        request.get({
            url : app.get("crypti address") + "/api/blocks/getFee",
            json : true
        }, function (err, response, body) {
            if (err || response.statusCode != 200) {
                return error({ success : false });
            } else if (body.success == true) {
                return success({ success : true, feePercent : body.fee.toFixed(4) });
            } else {
                return error({ success : false });
            }
        });
    }

    this.getXCRCourse = function () {
        if (exchange.XCRBTC) {
            return { success : true,
                     xcr : exchange.XCRBTC,
                     usd : exchange.convertXCRTOUSD(1) };
        } else {
            return { success : false };
        }
    }

    this.search = function (id, error, success) {
        if (id == null) {
            return error({ success : false });
        } else {
            searchBlock(id, error, success);
        }
    }

    // Private

    var exchange = app.exchange;

    var searchBlock = function (id, error, success) {
        new api.blocks(app).getBlock(
            id,
            function (body) {
                return searchTransaction(id, error, success);
            },
            function (body) {
                if (body.success == true) {
                    return success({ success : true, type : "block", id : body.block.id });
                } else {
                    return error({ success : false });
                }
            }
        );
    }

    var searchTransaction = function (id, error, success) {
        new api.transactions(app).getTransaction(
            id,
            function (body) {
                return searchAccount(id, error, success);
            },
            function (body) {
                if (body.success == true) {
                    return success({ success : true, type : "tx", id : body.transaction.id });
                } else {
                    return error({ success : false });
                }
            }
        );
    }

    var searchAccount = function (id, error, success) {
        new api.accounts(app).getAccount(
            id,
            function (body) {
                return error({ success : false });
            },
            function (body) {
                if (body.success == true) {
                    return success({ success : true, type : "address", id : id });
                } else {
                    return error({ success : false, found : false });
                }
            }
        );
    }
}
