'use strict';

const accounts = require('./accounts');
const blocks = require('./blocks');
const common = require('./common');
const delegates = require('./delegates');
const statistics = require('./statistics');
const transactions = require('./transactions');

module.exports = function (app, api) {
  this.accounts = new accounts(app, api);
  this.blocks = new blocks(app, api);
  this.common = new common(app, api);
  this.delegates = new delegates(app, api);
  this.statistics = new statistics(app, api);
  this.transactions = new transactions(app, api);
};

