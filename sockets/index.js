module.exports = function (app, io) {
    var ns = {
        activityGraph  : io.of('/activityGraph'),
        networkMonitor : io.of('/networkMonitor')
    }

    var activityGraph  = require('./activityGraph'),
        networkMonitor = require('./networkMonitor');

    var connectionHandler = function (socket, object) {
        var clients = 0;
        socket.on('connection', function (socket) {
            if (clients <= 0) {
                clients = 0;
                object.onInit();
                console.log('First connection');
            } else {
                object.onConnect();
                console.log('New connection');
            }
            clients++;
            socket.on('disconnect', function () {
                clients--;
                if (clients <= 0) {
                    clients = 0;
                    object.onDisconnect();
                    console.log('Closed connection');
                }
            });
        });
    }

    new activityGraph(app, connectionHandler, ns.activityGraph);
    new networkMonitor(app, connectionHandler, ns.networkMonitor);
}
