module.exports = function (app, io) {
    var networkMonitor = io.of('/networkMonitor');
    var statistics = require('./statistics');

    var connectionHandler = function (socket, object) {
        var clients = 0;
        socket.on('connection', function (socket) {
            if (clients <= 0) {
                clients = 0;
                object.onConnect();
            }
            clients++;
            socket.on('disconnect', function () {
                clients--;
                if (clients <= 0) {
                    clients = 0;
                    object.onDisconnect();
                }
            });
        });
    }

    new statistics(app, connectionHandler, networkMonitor);
}
