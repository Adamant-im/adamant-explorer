module.exports = function (app, io) {
    var ns = {
        networkMonitor : io.of('/networkMonitor')
    }

    var networkMonitor = require('./networkMonitor');

    var connectionHandler = function (socket, object) {
        var clients = 0;
        socket.on('connection', function (socket) {
            if (clients <= 0) {
                clients = 0;
                object.onInit();
            } else {
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

    new networkMonitor(app, connectionHandler, ns.networkMonitor);
}
