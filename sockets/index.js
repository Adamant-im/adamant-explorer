module.exports = function (app, io) {
    var ns = {
        activityGraph  : io.of('/activityGraph'),
        networkMonitor : io.of('/networkMonitor')
    }

    var activityGraph  = require('./activityGraph'),
        networkMonitor = require('./networkMonitor');

    var connectionHandler = function (name, socket, object) {
        var clients = 0;
        socket.on('connection', function (socket) {
            if (clients <= 0) {
                clients = 0;
                object.onInit();
                console.log(name, 'First connection');
            } else {
                object.onConnect();
                console.log(name, 'New connection');
            }
            clients++;
            socket.on('disconnect', function () {
                clients--;
                if (clients <= 0) {
                    clients = 0;
                    object.onDisconnect();
                    console.log(name, 'Closed connection');
                }
            });
        });
    }

    new activityGraph(app, connectionHandler, ns.activityGraph);
    new networkMonitor(app, connectionHandler, ns.networkMonitor);
}
