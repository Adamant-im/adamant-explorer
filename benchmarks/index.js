'use strict';

var accounts     = require('./accounts'),
    blocks       = require('./blocks'),
    common       = require('./common'),
    delegates    = require('./delegates'),
    statistics   = require('./statistics'),
    transactions = require('./transactions');

module.exports = function (app, api) {
    this.accounts     = new accounts(app, api);
    this.blocks       = new blocks(app, api);
    this.common       = new common(app, api);
    this.delegates    = new delegates(app, api);
    this.statistics   = new statistics(app, api);
    this.transactions = new transactions(app, api);
};

