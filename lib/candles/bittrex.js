'use strict';

var AbstractCandles = require('./abstract'),
    moment = require('moment'),
    _ = require('underscore'),
    util = require('util');

function BittrexCandles (client) {
    var self = this;

    AbstractCandles.apply(this, arguments);

    this.name  = 'bittrex';
    this.key   = this.name + 'Candles';
    this.url   = 'https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-LSK&count=50';
    this.start = '';
    this.last  = null;

    this.response = {
        error : 'message',
        data  : 'result'
    };

    this.candle = {
        id     : 'Id',
        date   : 'TimeStamp',
        price  : 'Price',
        amount : 'Quantity'
    };

    this.nextStart = function (data) {
        return moment(_.last(data).date).add(1, 's').unix();
    };

    this.acceptTrades = function (results, data) {
        return results.concat(data.reverse());
    };
}

util.inherits(BittrexCandles, AbstractCandles);
module.exports = BittrexCandles;
