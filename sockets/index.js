const adamantApi = require('../api/lib/adamant/requests/api');
const logger = require('../utils/log');

/**
 * Wire up Socket.IO namespaces for live explorer pages.
 *
 * Page-local sources run while clients are connected. Process-wide block and
 * peer caches continue updating independently and are only subscribed here.
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
    let initialized = false;

    ns.on('connection', (socket) => {
      handleConnection(socket).catch((error) => {
        logger.warn(
          `${name} Client initialization failed; connection remains available for retry: ${error}`,
        );
      });

      socket.on('disconnect', () => {
        if (clients() <= 0) {
          const wasInitialized = initialized;
          initialized = false;

          if (wasInitialized) {
            try {
              object.onDisconnect();
            } catch (error) {
              logger.warn(`${name} Page monitor cleanup failed: ${error}`);
            }
          }

          logger.debug(
            `${name} Last client disconnected; page monitor ${wasInitialized ? 'stopped' : 'was not started'}`,
          );
        } else {
          logger.debug(`${name} Client disconnected; clients=${clients()}`);
        }
      });
      socket.on('forceDisconnect', () => {
        logger.debug(`${name} Client requested forced disconnect`);
        socket.disconnect();
      });
    });

    // Private

    const handleConnection = async function (socket) {
      if (!adamantApi.isReady()) {
        socket.emit('status', {
          status: 'waiting',
          message: 'Waiting for ADAMANT node health check',
        });
        logger.debug(`${name} Client waiting for ADAMANT API readiness`);
      }

      await adamantApi.waitForReady();

      if (!ns.sockets.has(socket.id)) {
        logger.debug(`${name} Client disconnected before ADAMANT API became ready`);
        return;
      }

      if (!initialized) {
        try {
          object.onInit();
          initialized = true;
          logger.debug(
            `${name} First client connected; page monitor started; clients=${clients()}`,
          );
        } catch (error) {
          // A partially started module must not retain timers after a bad
          // upstream payload or another synchronous initialization failure.
          try {
            object.onDisconnect();
          } catch (cleanupError) {
            logger.warn(
              `${name} Page monitor cleanup after initialization failure failed: ${cleanupError}`,
            );
          }

          throw error;
        }
      } else {
        // Cache snapshots are sent only to the joining client. Broadcasting
        // them again would make every existing browser process duplicate data.
        object.onConnect(socket);
        logger.debug(`${name} Client connected; clients=${clients()}`);
      }
    };

    const clients = function () {
      return ns.sockets.size;
    };
  };

  new header(app, connectionHandler, namespaces.header);
  new activityGraph(app, connectionHandler, namespaces.activityGraph);
  new delegateMonitor(app, connectionHandler, namespaces.delegateMonitor);
  new networkMonitor(app, connectionHandler, namespaces.networkMonitor);
};
