'use strict';

var orders = require('../orders'),
    config = require('../../config'),
    _ = require('underscore');

module.exports = function (app) {
    var exchanges = {
        poloniex: new orders.poloniex(app.locals.redis),
        bittrex:  new orders.bittrex(app.locals.redis)
    };

    this.getOrders = function (e, error, success) {
        if (!config.marketWatcher.enabled) {
            return error({ success : false, error : 'Orders data not enabled' });
        }

        if (validExchange(e) === null) {
            return error({ success : false, error : 'Invalid Exchange' });
        }

        validExchange(e).restoreOrders(function (err, reply) {
            if (err) {
                return error({ success : false, error : 'Error retrieving orders data' });
            } else {
                return success({ success : true, orders : reply });
            }
        });
    };

    // Private
    /* Revisit this later to add more exchanges */
    var validExchange = function (e) {
        if (!_.has(config.marketWatcher.exchanges, e) || !config.marketWatcher.exchanges[e] || !exchanges[e]) {
            return null;
        }
        return exchanges[e];
    };
};
