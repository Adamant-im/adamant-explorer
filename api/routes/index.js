const accounts = require('./accounts.js');
const blocks = require('./blocks.js');
const common = require('./common.js');
const delegates = require('./delegates.js');
const networkHealth = require('./networkHealth.js');
const transactions = require('./transactions.js');

/**
 * Mount all explorer API routes on the Express application.
 * @param {Object} app Express application
 */
module.exports = (app) => {
  accounts(app);
  blocks(app);
  common(app);
  delegates(app);
  networkHealth(app);
  transactions(app);
};
