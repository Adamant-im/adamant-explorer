var delegates = require('../lib/api/delegates');

module.exports = function (app) {
    var api = new delegates(app);
}
