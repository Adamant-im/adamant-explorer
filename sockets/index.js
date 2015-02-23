module.exports = function (app, io) {
    var networkMonitor = io.of('/networkMonitor');
    var statistics = require('./statistics');

    new statistics(app, networkMonitor).wait();
}
