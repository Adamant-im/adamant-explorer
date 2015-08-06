'use strict';

var async = require('async'),
    request = require('request'),
    _ = require('underscore');

function AbstractOrders (client) {
    var self = this;

    this.name  = 'exchange';
    this.key   = this.name + 'Orders';
    this.url   = '';
    this.limit = 50;

    this.response = {
        error : 'message',
        asks  : 'asks',
        bids  : 'bids'
    };

    this.retrieveOrders = function (cb) {
        console.log('Orders:', 'Retrieving orders from', self.name + '...');

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
            } else {
                return cb(null, self.acceptOrders(body));
            }
        });
    };

    this.acceptOrders = function (data) {
        _.each([self.response.asks, self.response.bids], function (k) {
              if (!_.isArray(data[k])) {
                  console.log('Orders:', 'Unable to detect', k, 'for', self.name);
                  data[k] = [];
              } else {
                  data[k] = data[k].slice(0, self.limit);
              }
        });

        return {
            asks: data[self.response.asks],
            bids: data[self.response.bids]
        };
    };

    this.saveOrders = function (orders, cb) {
        var multi = client.multi();

        multi.SET(self.key, JSON.stringify(orders));
        multi.exec(function (err, replies) {
            if (err) {
                return cb(err);
            } else {
                console.log('Orders:', 'Orders saved successfully');
                return cb(null, orders);
            }
        });
    };

    this.restoreOrders = function (cb) {
        client.GET(self.key, function (err, reply) {
            if (err) {
                return cb(err);
            } else {
                reply = JSON.parse(reply.toString());
                console.log('Orders:', 'Orders restored successfully');
                return cb(null, reply);
            }
        });
    };

    this.updateOrders = function (cb) {
        console.log('Orders:', 'Updating orders for', self.name + '...');

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
