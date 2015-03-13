var blocks = require('./blocks.js'),
    common = require('./common.js'),
    accounts = require('./accounts.js'),
    transactions = require('./transactions.js'),
    statistics = require('./statistics.js');

module.exports = function (app) {
    blocks(app);
    common(app);
    accounts(app);
    transactions(app);
    statistics(app);
}
