'use strict';

var AbstractOrders = require('./abstract'),
    util = require('util');

function PoloniexOrders (client) {
    var self = this;

    AbstractOrders.apply(this, arguments);

    this.name  = 'poloniex';
    this.key   = this.name + 'Orders';
    this.url   = 'https://poloniex.com/public?command=returnOrderBook&currencyPair=BTC_LSK&depth=100';

    this.reverse = {
        bids : true,
        asks : false
    };

    this.response = {
        error : 'error',
        asks  : 'asks',
        bids  : 'bids'
    };
}

util.inherits(PoloniexOrders, AbstractOrders);
module.exports = PoloniexOrders;
