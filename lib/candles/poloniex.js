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
    this.url   = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair=BTC_LISK&start=';
    this.start = 1408708935; // 2014-08-22 13:02:15

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
