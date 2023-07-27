const accounts = require('./accounts.js');
const blocks = require('./blocks.js');
const exchanges = require('./exchanges.js');
const common = require('./common.js');
const delegates = require('./delegates.js');
const statistics = require('./statistics.js');
const transactions = require('./transactions.js');

module.exports = (app) => {
  accounts(app);
  blocks(app);
  exchanges(app);
  common(app);
  delegates(app);
  statistics(app);
  transactions(app);
};
