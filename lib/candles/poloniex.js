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

    var now = new Date();
    this.start = now.setDate(now.getDate() - 365); // 1 year ago

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
