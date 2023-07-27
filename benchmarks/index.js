const accounts = require('./accounts');
const blocks = require('./blocks');
const common = require('./common');
const delegates = require('./delegates');
const statistics = require('./statistics');
const transactions = require('./transactions');

module.exports = function (app) {
  this.accounts = new accounts();
  this.blocks = new blocks();
  this.common = new common(app);
  this.delegates = new delegates();
  this.statistics = new statistics();
  this.transactions = new transactions();
};

