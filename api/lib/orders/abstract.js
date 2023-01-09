'use strict';

const async = require('async');
const axios = require("axios");
const _ = require('underscore');
const logger = require('../../../utils/log');

function AbstractOrders(client) {
  const self = this;

  this.name = 'exchange';
  this.key = this.name + 'Orders';
  this.url = '';
  this.limit = 100;

  this.reverse = {
    bids: true,
    asks: true,
  };

  this.response = {
    error: 'message',
    asks: 'asks',
    bids: 'bids',
  };

  this.retrieveOrders = function (cb) {
    logger.info('Orders: ' + 'Retrieving orders from'+  self.name + '...');

    return axios({
      url: self.url,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return cb('Response was unsuccessful');
        }
        const message = response.data[self.response.error];
        if (message) {
          return cb(message);
        } else if (_.isObject(response.data)) {
          return cb(null, self.acceptOrders(response.data));
        } else {
          return cb('Invalid data received');
        }
      })
      .catch((err) => {
        return cb(err);
      });
  };

  this.acceptOrders = function (data) {
    _.each([self.response.asks, self.response.bids], (k) => {
      if (!_.isArray(data[k])) {
        data[k] = [];
      }
    });

    const asks = self.response.asks;
    const bids = self.response.bids;

    data[bids] = (self.reverse.bids) ? data[bids].reverse() : data[bids];
    data[bids] = data[bids].slice(0, self.limit);
    data[asks] = (self.reverse.asks) ? data[asks].reverse() : data[asks];
    data[asks] = data[asks].slice(0, self.limit);

    return self.addDepth({
      asks: self.translateOrders(data[asks]),
      bids: self.translateOrders(data[bids]),
    });
  };

  this.translateOrders = (orders) => {
    return _.map(orders, (o) => {
      return [Number(o[0]), Number(o[1])];
    });
  };

  this.addDepth = function (data) {
    const depth = [];
    let bidVolume = 0;
    let askVolume = 0;

    _.each(data.bids, (bid) => {
      bidVolume += (bid[0] * bid[1]);
    });

    _.each(data.bids, (bid) => {
      depth.push({
        price: bid[0].toFixed(8),
        amount: bid[1].toFixed(8),
        bid: (bidVolume -= (bid[0] * bid[1])).toFixed(8),
        ask: null,
      });
    });

    _.each(data.asks, (ask) => {
      depth.push({
        price: ask[0].toFixed(8),
        amount: ask[1].toFixed(8),
        ask: (askVolume += (ask[0] * ask[1])).toFixed(8),
        bid: null,
      });
    });

    if (self.reverse.bids) {
      data[self.response.bids] = data[self.response.bids].reverse();
    }

    data.depth = depth;
    return data;
  };

  this.saveOrders = function (orders, cb) {
    const multi = client.multi();

    multi.SET(self.key, JSON.stringify(orders));
    multi.exec((err, replies) => {
      if (err) {
        return cb(err);
      } else {
        logger.info('Orders: ' + 'Orders saved successfully');
        return cb(null, orders);
      }
    });
  };

  this.restoreOrders = function (cb) {
    client.GET(self.key, (err, reply) => {
      if (err) {
        return cb(err);
      } else {
        if (reply) {
          reply = JSON.parse(reply.toString());
        } else {
          reply = {};
        }
        logger.info('Orders: ' + 'Orders restored successfully');
        return cb(null, reply);
      }
    });
  };

  this.updateOrders = function (cb) {
    logger.info('Orders: ' + 'Updating orders for' + self.name + '...');

    async.waterfall([
        (callback) => {
          return self.retrieveOrders(callback);
        },
        (results, callback) => {
          return self.saveOrders(results, callback);
        },
      ],
      (err, results) => {
        if (err) {
          return cb(err);
        } else {
          return cb(null, results);
        }
      });
  };
}

module.exports = AbstractOrders;
