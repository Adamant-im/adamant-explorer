'use strict';

const logger = require('../utils/log');

module.exports = function (app, io) {
  const ns = {
    header: io.of('/header'),
    activityGraph: io.of('/activityGraph'),
    delegateMonitor: io.of('/delegateMonitor'),
    marketWatcher: io.of('/marketWatcher'),
    networkMonitor: io.of('/networkMonitor'),
  };

  const header = require('./header');
  const activityGraph = require('./activityGraph');
  const delegateMonitor = require('./delegateMonitor');
  const marketWatcher = require('./marketWatcher');
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

  new header(app, connectionHandler, ns.header);
  new activityGraph(app, connectionHandler, ns.activityGraph);
  new delegateMonitor(app, connectionHandler, ns.delegateMonitor);
  new marketWatcher(app, connectionHandler, ns.marketWatcher);
  new networkMonitor(app, connectionHandler, ns.networkMonitor);
};

