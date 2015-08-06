'use strict';

var AbstractOrders = require('./abstract'),
    util = require('util');

function BterOrders (client) {
    var self = this;

    AbstractOrders.apply(this, arguments);

    this.name  = 'bter';
    this.key   = this.name + 'Orders';
    this.url   = 'http://data.bter.com/api/1/depth/xcr_btc';

    this.response = {
        error : 'message',
        asks  : 'asks',
        bids  : 'bids'
    };
}

util.inherits(BterOrders, AbstractOrders);
module.exports = BterOrders;
