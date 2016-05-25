'use strict';

var AbstractCandles = require('./abstract'),
    moment = require('moment'),
    _ = require('underscore'),
    util = require('util');

function PoloniexCandles (client) {
    var self = this;

    AbstractCandles.apply(this, arguments);

    this.name  = 'poloniex';
    this.key   = this.name + 'Candles';
    this.url   = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair=BTC_LSK&start=';
    this.start = 1464126157; // 2016-05-24 00:00:00 GMT

    this.response = {
        error : 'error',
        data  : null
    };

    this.candle = {
        id     : 'tradeID',
        date   : 'date',
        price  : 'rate',
        amount : 'amount'
    };

    this.nextStart = function (data) {
        return moment(_.last(data).date).add(1, 's').unix();
    };

    this.acceptTrades = function (results, data) {
        return results.concat(data.reverse());
    };
}

util.inherits(PoloniexCandles, AbstractCandles);
module.exports = PoloniexCandles;
