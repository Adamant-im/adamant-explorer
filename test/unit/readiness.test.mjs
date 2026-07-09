import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);

function deferred() {
  let resolve;
  const promise = new Promise((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function nextTick() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

describe('ADAMANT API readiness', function () {
  let socketsIndexPath;
  let apiPath;
  let socketModulePaths = [];

  afterEach(function () {
    if (socketsIndexPath) {
      delete require.cache[socketsIndexPath];
    }

    if (apiPath) {
      delete require.cache[apiPath];
    }

    for (const modulePath of socketModulePaths) {
      delete require.cache[modulePath];
    }

    socketsIndexPath = undefined;
    apiPath = undefined;
    socketModulePaths = [];
  });

  it('waits before passing API requests to route handlers', async function () {
    const createMiddleware = require('../../api/lib/adamant/middleware/readiness.js');
    const ready = deferred();
    const calls = [];
    const middleware = createMiddleware({
      isReady: () => false,
      waitForReady: () => ready.promise,
    });

    const result = middleware({ originalUrl: '/api/getHeight' }, {}, (error) => {
      calls.push(error);
    });

    await nextTick();
    expect(calls).to.deep.equal([]);

    ready.resolve();
    await result;
    expect(calls).to.deep.equal([undefined]);
  });

  it('does not wait for non-API requests', async function () {
    const createMiddleware = require('../../api/lib/adamant/middleware/readiness.js');
    const middleware = createMiddleware({
      isReady: () => false,
      waitForReady: () => {
        throw new Error('should not wait');
      },
    });
    const calls = [];

    await middleware({ originalUrl: '/delegateMonitor' }, {}, (error) => {
      calls.push(error);
    });

    expect(calls).to.deep.equal([undefined]);
  });

  it('defers first monitor initialization until the shared API client is ready', async function () {
    const ready = deferred();
    const modules = {};
    const namespaces = {};

    socketsIndexPath = require.resolve('../../sockets/index.js');
    apiPath = require.resolve('../../api/lib/adamant/requests/api.js');
    socketModulePaths = ['header', 'activityGraph', 'delegateMonitor', 'networkMonitor'].map(
      (name) => require.resolve(`../../sockets/${name}.js`),
    );

    require.cache[apiPath] = {
      exports: {
        isReady: () => false,
        waitForReady: () => ready.promise,
      },
    };

    for (const modulePath of socketModulePaths) {
      require.cache[modulePath] = {
        exports: function socketModule(app, connectionHandler, namespace) {
          const moduleState = {
            initCount: 0,
            connectCount: 0,
            disconnectCount: 0,
            onInit() {
              this.initCount++;
            },
            onConnect() {
              this.connectCount++;
            },
            onDisconnect() {
              this.disconnectCount++;
            },
          };
          modules[namespace.name] = moduleState;
          new connectionHandler(`${namespace.name}:`, namespace, moduleState);
        },
      };
    }

    const io = {
      of(name) {
        const namespace = {
          name,
          sockets: new Map(),
          handlers: {},
          on(event, handler) {
            this.handlers[event] = handler;
          },
        };
        namespaces[name] = namespace;
        return namespace;
      },
    };

    require(socketsIndexPath)({}, io);

    const namespace = namespaces['/header'];
    const socket = {
      id: 'socket-1',
      emitted: [],
      handlers: {},
      emit(event, payload) {
        this.emitted.push({ event, payload });
      },
      on(event, handler) {
        this.handlers[event] = handler;
      },
    };
    namespace.sockets.set(socket.id, socket);
    namespace.handlers.connection(socket);

    await nextTick();
    expect(modules['/header'].initCount).to.equal(0);
    expect(socket.emitted).to.deep.equal([
      {
        event: 'status',
        payload: {
          status: 'waiting',
          message: 'Waiting for ADAMANT node health check',
        },
      },
    ]);

    ready.resolve();
    await ready.promise;
    await nextTick();

    expect(modules['/header'].initCount).to.equal(1);
    expect(modules['/header'].connectCount).to.equal(0);
  });
});
