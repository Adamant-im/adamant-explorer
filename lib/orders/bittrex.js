'use strict';

// This is an example for Bittrex exchange with BTC_LSK pair

const AbstractOrders = require('./abstract');
const util = require('util');
const _ = require('underscore');
const logger = require('../../utils/log');
const axios = require("axios");

function BittrexOrders(client) {
  const self = this;

  AbstractOrders.apply(this, arguments);

  this.name = 'bittrex';
  this.key = this.name + 'Orders';
  this.url = 'https://bittrex.com/api/v1.1/public/getorderbook?market=BTC-LSK&type=both&depth=50';
  this.limit = 100;

  this.reverse = {
    bids: true,
    asks: false,
  };

  this.retrieveOrders = function (cb) {
    logger.info('Orders: ' + 'Retrieving orders from' + self.name + '...');

    return axios({
      url: self.url,
      method: 'get',
    })
      .then((response) => {
        if (response.status !== 200) {
          return cb('Response was unsuccessful');
        }
        const message = response.data.message;
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
    let asks = [];
    let bids = [];
    let i;

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
      bids: self.translateOrders(bids),
    });
  };

  this.addDepth = function (data) {
    let depth = [];
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
