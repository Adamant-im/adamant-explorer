'use strict';

var AbstractCandles = require('./abstract'),
    _ = require('underscore'),
    util = require('util');

function BterCandles (client) {
    var self = this;

    AbstractCandles.apply(this, arguments);

    this.name  = 'bter';
    this.key   = this.name + 'Candles';
    this.url   = 'http://data.bter.com/api/1/trade/xcr_btc/';
    this.start = 8639132;

    this.response = {
        error : 'message',
        data  : 'data'
    };

    this.candle = {
        id     : 'tid',
        date   : 'date',
        price  : 'price',
        amount : 'amount'
    };

    this.nextStart = function (data) {
        return parseInt(_.last(data).tid);
    };
}

util.inherits(BterCandles, AbstractCandles);
module.exports = BterCandles;
