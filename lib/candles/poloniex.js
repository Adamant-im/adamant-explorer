'use strict';

var AbstractCandles = require('./abstract'),
    moment = require('moment'),
    _ = require('underscore'),
    util = require('util');

function PoloniexCandles (client, params) {
    var self = this;

    AbstractCandles.apply(this, arguments);

    var now = Math.floor(Date.now() / 1000);
    this.start = params && params.buildTimeframe ? (now - params.buildTimeframe) : null;
    this.end   = now; // Current unix timestamp (in sec)

    this.name  = 'poloniex';
    this.key   = this.name + 'Candles';
    this.url   = 'https://poloniex.com/public?command=returnTradeHistory&currencyPair=BTC_LSK';

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

    this.nextEnd = function (data) {
        return moment(_.first(data).date).subtract(1, 's').unix();
    };

    this.acceptTrades = function (results, data) {
        return results.concat(data.reverse());
    };
}

util.inherits(PoloniexCandles, AbstractCandles);
module.exports = PoloniexCandles;
