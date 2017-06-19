'use strict';

var AbstractOrders = require('./abstract'),
    request = require('request'),
    util = require('util'),
    _ = require('underscore'),
    logger = require('../../utils/logger');

function BittrexOrders (client) {
    var self = this;

    AbstractOrders.apply(this, arguments);

    this.name  = 'bittrex';
    this.key   = this.name + 'Orders';
    this.url   = 'https://bittrex.com/api/v1.1/public/getorderbook?market=BTC-LSK&type=both&depth=50';
    this.limit = 100;

    this.reverse = {
        bids : true,
        asks : false
    };

    this.retrieveOrders = function (cb) {
        logger.info('Orders:', 'Retrieving orders from', self.name + '...');

        request.get({
            url : self.url,
            json : true
        }, function (err, resp, body) {
            if (err || resp.statusCode !== 200) {
                return cb(err || 'Response was unsuccessful');
            }

            var message = body.message;
            if (message) {
                return cb(message);
            } else if (_.isObject(body)) {
                return cb(null, self.acceptOrders(body));
            } else {
                return cb('Invalid data received');
            }
        });
    };

    this.acceptOrders = function (data) {
        var asks = [],
            bids = [],
            i;

        for (i in data.result.buy) {
            bids.push([data.result.buy[i].Rate, data.result.buy[i].Quantity]);
        }

        for (i in data.result.sell) {
            asks.push([data.result.sell[i].Rate, data.result.sell[i].Quantity]);
        }

        bids = (self.reverse.bids) ? bids.reverse() : bids;
        bids = bids.slice(0, self.limit);
        asks = (self.reverse.asks) ? asks.reverse() : asks;
        asks = asks.slice(0, self.limit);

        return self.addDepth({
            asks: self.translateOrders(asks),
            bids: self.translateOrders(bids)
        });
    };

    this.addDepth = function (data) {
        var depth = [], bidVolume = 0, askVolume = 0;

        _.each(data.bids, function (bid) {
            bidVolume += (bid[0] * bid[1]);
        });

        _.each(data.bids, function (bid) {
            depth.push({
                price: bid[0].toFixed(8),
                amount: bid[1].toFixed(8),
                bid: (bidVolume -= (bid[0] * bid[1])).toFixed(8),
                ask: null
            });
        });

        _.each(data.asks, function (ask) {
            depth.push({
                price: ask[0].toFixed(8),
                amount: ask[1].toFixed(8),
                ask: (askVolume += (ask[0] * ask[1])).toFixed(8),
                bid: null
            });
        });

        if (self.reverse.bids) {
            data.bids = data.bids.reverse();
        }

        if (self.reverse.asks) {
            data.asks = data.asks.reverse();
        }

        data.depth = depth;
        return data;
    };
}

util.inherits(BittrexOrders, AbstractOrders);
module.exports = BittrexOrders;
