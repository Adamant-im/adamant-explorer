const logger = require('../utils/log');

module.exports = function (app, io) {
  const namespaces = {
    header: io.of('/header'),
    activityGraph: io.of('/activityGraph'),
    delegateMonitor: io.of('/delegateMonitor'),
    networkMonitor: io.of('/networkMonitor'),
  };

  const header = require('./header');
  const activityGraph = require('./activityGraph');
  const delegateMonitor = require('./delegateMonitor');
  const networkMonitor = require('./networkMonitor');

  const connectionHandler = function (name, ns, object) {
    ns.on('connection', (socket) => {
      if (clients() <= 1) {
        object.onInit();
        logger.info(name + 'First connection');
      } else {
        object.onConnect();
        logger.info(name + 'New connection');
      }
      socket.on('disconnect', () => {
        if (clients() <= 0) {
          object.onDisconnect();
          logger.info(name + 'Closed connection');
        }
      });
      socket.on('forceDisconnect', () => {
        socket.disconnect();
      });
    });

    // Private

    const clients = function () {
      return ns.sockets.size;
    };
  };

  new header(app, connectionHandler, namespaces.header);
  new activityGraph(app, connectionHandler, namespaces.activityGraph);
  new delegateMonitor(app, connectionHandler, namespaces.delegateMonitor);
  new networkMonitor(app, connectionHandler, namespaces.networkMonitor);
};

