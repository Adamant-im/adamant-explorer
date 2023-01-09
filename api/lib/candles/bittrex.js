'use strict';

// This is an example for Bittrex exchange with BTC-LSK pair

const AbstractCandles = require('./abstract');
const util = require('util');

function BittrexCandles(client) {
  const self = this;

  AbstractCandles.apply(this, arguments);

  this.name = 'bittrex';
  this.key = this.name + 'Candles';
  this.url = 'https://bittrex.com/api/v1.1/public/getmarkethistory?market=BTC-LSK&count=50';
  this.start = '';
  this.last = null;

  this.response = {
    error: 'message',
    data: 'result',
  };

  this.candle = {
    id: 'Id',
    date: 'TimeStamp',
    price: 'Price',
    amount: 'Quantity',
  };

  this.acceptTrades = (results, data) => {
    return results.concat(data.reverse());
  };
}

util.inherits(BittrexCandles, AbstractCandles);
module.exports = BittrexCandles;
