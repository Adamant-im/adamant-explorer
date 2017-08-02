'use strict';

var async = require('async'),
    request = require('request'),
    _ = require('underscore'),
    logger = require('../../utils/logger');

function AbstractOrders (client) {
    var self = this;

    this.name  = 'exchange';
    this.key   = this.name + 'Orders';
    this.url   = '';
    this.limit = 100;

    this.reverse = {
        bids : true,
        asks : true
    };

    this.response = {
        error : 'message',
        asks  : 'asks',
        bids  : 'bids'
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

            var message = body[self.response.error];
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
        _.each([self.response.asks, self.response.bids], function (k) {
            if (!_.isArray(data[k])) { data[k] = []; }
        });

        var asks = self.response.asks,
            bids = self.response.bids;

        data[bids] = (self.reverse.bids) ? data[bids].reverse() : data[bids];
        data[bids] = data[bids].slice(0, self.limit);
        data[asks] = (self.reverse.asks) ? data[asks].reverse() : data[asks];
        data[asks] = data[asks].slice(0, self.limit);

        return self.addDepth({
            asks: self.translateOrders(data[asks]),
            bids: self.translateOrders(data[bids])
        });
    };

    this.translateOrders = function (orders) {
        return _.map(orders, function (o) {
            return [Number(o[0]), Number(o[1])];
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
            data[self.response.bids] = data[self.response.bids].reverse();
        }

        data.depth = depth;
        return data;
    };

    this.saveOrders = function (orders, cb) {
        var multi = client.multi();

        multi.SET(self.key, JSON.stringify(orders));
        multi.exec(function (err, replies) {
            if (err) {
                return cb(err);
            } else {
                logger.info('Orders:', 'Orders saved successfully');
                return cb(null, orders);
            }
        });
    };

    this.restoreOrders = function (cb) {
        client.GET(self.key, function (err, reply) {
            if (err) {
                return cb(err);
            } else {
                if (reply) {
                    reply = JSON.parse(reply.toString());
                } else {
                    reply = {};
                }
                logger.info('Orders:', 'Orders restored successfully');
                return cb(null, reply);
            }
        });
    };

    this.updateOrders = function (cb) {
        logger.info('Orders:', 'Updating orders for', self.name + '...');

        async.waterfall([
            function (callback) {
                return self.retrieveOrders(callback);
            },
            function (results, callback) {
                return self.saveOrders(results, callback);
            }
        ],
        function (err, results) {
            if (err) {
                return cb(err);
            } else {
                return cb(null, results);
            }
        });
    };
}

module.exports = AbstractOrders;
