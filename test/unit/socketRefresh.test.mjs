import { createRequire } from 'node:module';
import { expect } from 'chai';
import { BLOCK_INTERVAL_MILLISECONDS } from '../../api/lib/adamant/constants.mjs';

const require = createRequire(import.meta.url);
const originalSetInterval = global.setInterval;
const originalClearInterval = global.clearInterval;
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

describe('socket-driven refresh scheduling', function () {
  const originalModules = new Map();

  function stubModule(modulePath, exports) {
    if (!originalModules.has(modulePath)) {
      originalModules.set(modulePath, require.cache[modulePath]);
    }

    require.cache[modulePath] = { exports };
  }

  afterEach(function () {
    for (const [modulePath, originalModule] of originalModules) {
      if (originalModule) {
        require.cache[modulePath] = originalModule;
      } else {
        delete require.cache[modulePath];
      }
    }

    originalModules.clear();
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  it('schedules Activity Graph after the current block refresh settles', function () {
    const activityGraphPath = require.resolve('../../sockets/activityGraph.js');
    const statisticsPath = require.resolve('../../api/lib/adamant/handlers/statistics.js');
    const transactionsPath = require.resolve('../../api/lib/adamant/handlers/transactions.js');
    const loggerPath = require.resolve('../../utils/log.js');
    let intervalDelay;
    let clearedTimer;
    const logCalls = [];

    stubModule(statisticsPath, {
      getLastBlock(error, success) {
        success({
          success: true,
          block: { id: 'block-100', height: 100, numberOfTransactions: 0 },
        });
      },
    });
    stubModule(transactionsPath, {});
    stubModule(
      loggerPath,
      Object.fromEntries(
        ['error', 'warn', 'info', 'log', 'debug'].map((level) => [
          level,
          (message) => logCalls.push({ level, message }),
        ]),
      ),
    );
    originalModules.set(activityGraphPath, require.cache[activityGraphPath]);
    delete require.cache[activityGraphPath];

    global.setTimeout = (callback, delay) => {
      intervalDelay = delay;
      return callback;
    };
    global.clearTimeout = (timer) => {
      clearedTimer = timer;
    };

    const ActivityGraph = require(activityGraphPath);
    const socket = {
      emitted: [],
      emit(event, payload) {
        this.emitted.push({ event, payload });
      },
    };
    const graph = new ActivityGraph({}, function connectionHandler() {}, socket);

    graph.onInit();

    expect(intervalDelay).to.equal(BLOCK_INTERVAL_MILLISECONDS);
    expect(socket.emitted).to.deep.include({
      event: 'data',
      payload: {
        success: true,
        block: { id: 'block-100', height: 100, numberOfTransactions: 0 },
      },
    });
    expect(logCalls).to.deep.include({
      level: 'debug',
      message: 'Activity Graph: Emitted data; height=100; transactions=0',
    });

    graph.onDisconnect();
    expect(clearedTimer).to.be.a('function');
  });

  it('forwards shared new-block events through the Header namespace', async function () {
    const headerPath = require.resolve('../../sockets/header.js');
    const blocksPath = require.resolve('../../api/lib/adamant/handlers/blocks.js');
    const blockRequestsPath = require.resolve('../../api/lib/adamant/requests/blocks.js');
    const commonPath = require.resolve('../../api/lib/adamant/handlers/common.js');
    const delegatesPath = require.resolve('../../api/lib/adamant/requests/delegates.js');
    const networkHealthPath = require.resolve('../../api/lib/adamant/helpers/networkHealth.js');
    const statisticsPath = require.resolve('../../api/lib/adamant/handlers/statistics.js');
    const schedulePath = require.resolve('../../sockets/delegateMonitorSchedule.js');
    const loggerPath = require.resolve('../../utils/log.js');
    let blockListener;
    let unsubscribeCount = 0;
    const logCalls = [];

    stubModule(blocksPath, {
      getBlockStatus(error, success) {
        success({ success: true, height: 100, supply: 1, nethash: 'testnet' });
      },
    });
    stubModule(blockRequestsPath, {
      async getBlocks() {
        return [{ height: 100, generatorPublicKey: 'delegate-0' }];
      },
    });
    stubModule(commonPath, {
      getPriceTicker(enabled, exchange, error, success) {
        success({ success: true, tickers: {} });
      },
    });
    stubModule(delegatesPath, {
      async getNextForgersState() {
        return {
          currentBlock: 100,
          delegates: Array.from({ length: 101 }, (_, index) => `delegate-${index}`),
        };
      },
    });
    stubModule(networkHealthPath, {
      countActiveForgingDelegates() {
        return 101;
      },
      mergeForgingHealthBlocks(cachedBlocks, freshBlocks, currentBlock) {
        return [...freshBlocks, ...cachedBlocks].filter(
          (block) => Number(block.height) <= currentBlock,
        );
      },
    });
    stubModule(statisticsPath, {
      getCachedBlocks() {
        return [{ height: 100, generatorPublicKey: 'delegate-0' }];
      },
      subscribeBlockStatistics(listener) {
        blockListener = listener;
        return () => {
          unsubscribeCount++;
        };
      },
    });
    stubModule(schedulePath, {
      getForgingSchedule(state) {
        return { orderedDelegates: state.delegates };
      },
      getRoundDelegates() {
        return [];
      },
    });
    stubModule(
      loggerPath,
      Object.fromEntries(
        ['error', 'warn', 'info', 'log', 'debug'].map((level) => [
          level,
          (message) => logCalls.push({ level, message }),
        ]),
      ),
    );
    originalModules.set(headerPath, require.cache[headerPath]);
    delete require.cache[headerPath];

    global.setInterval = (callback) => callback;
    global.clearInterval = () => {};

    const Header = require(headerPath);
    const socket = {
      emitted: [],
      emit(event, payload) {
        this.emitted.push({ event, payload });
      },
    };
    const app = { exchange: {}, get: () => false };
    const header = new Header(app, function connectionHandler() {}, socket);

    header.onInit();
    await new Promise((resolve) => setImmediate(resolve));

    expect(blockListener).to.be.a('function');
    blockListener({
      source: 'websocket',
      lastBlock: { id: 'block-101', height: 101, timestamp: 505 },
    });

    expect(socket.emitted).to.deep.include({
      event: 'block',
      payload: {
        id: 'block-101',
        height: 101,
        timestamp: 505,
        forgingDelegates: 101,
      },
    });
    expect(logCalls).to.deep.include({
      level: 'debug',
      message: 'Header: Forwarded block event; height=101; source=websocket',
    });

    header.onConnect();
    const latestData = socket.emitted.filter(({ event }) => event === 'data').at(-1).payload;
    expect(latestData.status.height).to.equal(101);

    header.onDisconnect();
    expect(unsubscribeCount).to.equal(1);
  });
});
