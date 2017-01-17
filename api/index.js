'use strict';

var accounts = require('./accounts.js'),
    blocks = require('./blocks.js'),
    exchanges = require('./exchanges.js'),
    common = require('./common.js'),
    delegates = require('./delegates.js'),
    statistics = require('./statistics.js'),
    transactions = require('./transactions.js');

module.exports = function (app) {
    accounts(app);
    blocks(app);
    exchanges(app);
    common(app);
    delegates(app);
    statistics(app);
    transactions(app);
};
