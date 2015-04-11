var accounts = require('./accounts.js'),
    blocks = require('./blocks.js'),
    common = require('./common.js'),
    statistics = require('./statistics.js'),
    transactions = require('./transactions.js');

module.exports = function (app) {
    accounts(app);
    blocks(app);
    common(app);
    statistics(app);
    transactions(app);
}
