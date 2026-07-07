const logger = require('../utils/log');

/**
 * Wire up Socket.IO namespaces for live explorer pages.
 *
 * Each namespace module starts polling the node while at least one
 * client is connected and stops when the last client disconnects.
 * @param {Object} app Express application
 * @param {Object} io Socket.IO server
 */
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

  /**
   * Bind namespace life cycle events to a socket data module.
   * @param {string} name Log message prefix, e.g. `'Header:'`
   * @param {Object} ns Socket.IO namespace
   * @param {Object} object Module with `onInit`, `onConnect`, and `onDisconnect` hooks
   */
  const connectionHandler = function (name, ns, object) {
    ns.on('connection', (socket) => {
      if (clients() <= 1) {
        object.onInit();
        logger.info(`${name} First connection`);
      } else {
        object.onConnect();
        logger.info(`${name} New connection`);
      }
      socket.on('disconnect', () => {
        if (clients() <= 0) {
          object.onDisconnect();
          logger.info(`${name} Closed connection`);
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
