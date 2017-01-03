'use strict';

var orders = require('../orders'),
    _ = require('underscore');

module.exports = function (app) {
    var poloniex = new orders.poloniex(app.locals.redis);
    var bittrex = new orders.bittrex(app.locals.redis);

    this.getOrders = function (e, error, success) {
        if (!app.get('orders enabled')) {
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
        if (e === 'poloniex') {
            return poloniex;
        } else if (e === 'bittrex') {
            return bittrex;
        } else {
            return null;
        }
    };
};
