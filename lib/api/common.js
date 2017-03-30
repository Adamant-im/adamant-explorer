'use strict';

var request = require('request');

module.exports = function (app, api) {
    this.version = function () {
        return { version : app.get('version') };
    };

    this.getPriceTicker = function (error, success) {
        if (app.get('exchange enabled')) {
            // If exchange rates are enabled - that endpoint cannot fail, in worst case we return empty object here
            return success({ success: true, tickers: exchange.tickers });
        } else {
            // We use success callback here on purpose
            return success({ success: false, error: 'Exchange rates are disabled' });
        }
    };

    this.search = function (id, error, success) {
        if (id === null) {
            return error({ success : false, error : 'Missing/Invalid search criteria' });
        } else {
            searchHeight(id, error, success);
        }
    };

    // Private

    var exchange = app.exchange;

    var searchHeight = function (id, error, success) {
        new api.blocks(app).getHeight(
            id,
            function (body) {
                return searchBlock(id, error, success);
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
                return searchDelegates(id, error, success);
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

    var searchDelegates = function (id, error, success) {
            new api.delegates(app).getSearch(
            id,
            function (body) {
                return error({ success : false, error : body.error });
            },
            function (body) {
                if (body.success === true) {
                    return success({ success : true, type : 'address', id : body.address });
                } else {
                    return error({ success : false, error : null, found : false });
                }
            }
        );
    };

};
