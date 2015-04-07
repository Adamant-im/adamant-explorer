module.exports = function (app, io) {
    var ns = {
        activityGraph  : io.of('/activityGraph'),
        networkMonitor : io.of('/networkMonitor')
    }

    var activityGraph  = require('./activityGraph'),
        networkMonitor = require('./networkMonitor');

    var connectionHandler = function (name, ns, object) {
        ns.on('connection', function (socket) {
            if (clients() <= 1) {
                object.onInit();
                console.log(name, 'First connection');
            } else {
                object.onConnect();
                console.log(name, 'New connection');
            }
            socket.on('disconnect', function () {
                if (clients() <= 0) {
                    object.onDisconnect();
                    console.log(name, 'Closed connection');
                }
            });
            socket.on('forceDisconnect', function () {
                socket.disconnect();
            });
        });

        // Private

        var clients = function () {
            return Object.keys(ns.connected).length;
        }
    }

    new activityGraph(app, connectionHandler, ns.activityGraph);
    new networkMonitor(app, connectionHandler, ns.networkMonitor);
}
