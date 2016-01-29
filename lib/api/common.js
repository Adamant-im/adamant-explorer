'use strict';

var request = require('request');

module.exports = function (app, api) {
    this.version = function () {
        return { version : app.get('version') };
    };

    this.getPriceTicker = function (error, success) {
        if (exchange.LISKBTC) {
            if (exchange.LISKBTC == '~') {
                return success({ success : true, btc_usd : (0).toFixed(8), lisk_btc : (0).toFixed(8), lisk_usd : (0).toFixed(2) });
            } else {
                return success({ success : true, btc_usd : exchange.BTCUSD, lisk_btc : exchange.LISKBTC, lisk_usd : exchange.LISKUSD(1) });
            }
        } else {
            return error({ success : false });
        }
    };

    this.search = function (id, error, success) {
        if (id === null) {
            return error({ success : false, error : 'Missing/Invalid search criteria' });
        } else {
            searchBlock(id, error, success);
        }
    };

    // Private

    var exchange = app.exchange;

    var searchBlock = function (id, error, success) {
        new api.blocks(app).getBlock(
            id,
            function (body) {
                return searchTransaction(id, error, success);
            },
            function (body) {
                if (body.success === true) {
                    return success({ success : true, type : 'block', id : body.block.id });
                } else {
                    return error({ success : false, error : body.error });
                }
            }
        );
    };

    var searchTransaction = function (id, error, success) {
        new api.transactions(app).getTransaction(
            id,
            function (body) {
                return searchAccount(id, error, success);
            },
            function (body) {
                if (body.success === true) {
                    return success({ success : true, type : 'tx', id : body.transaction.id });
                } else {
                    return error({ success : false, error : body.error });
                }
            }
        );
    };

    var searchAccount = function (id, error, success) {
        new api.accounts(app).getAccount(
            id,
            function (body) {
                return error({ success : false, error : body.error });
            },
            function (body) {
                if (body.success === true) {
                    return success({ success : true, type : 'address', id : id });
                } else {
                    return error({ success : false, error : null, found : false });
                }
            }
        );
    };
};
