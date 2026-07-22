import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const handlerPath = require.resolve('../../api/lib/adamant/handlers/statistics.js');
const blocksPath = require.resolve('../../api/lib/adamant/requests/blocks.js');
const statisticsRequestsPath = require.resolve('../../api/lib/adamant/requests/statistics.js');
const apiPath = require.resolve('../../api/lib/adamant/requests/api.js');
const loggerPath = require.resolve('../../utils/log.js');
const originalSetInterval = global.setInterval;
const originalSetTimeout = global.setTimeout;

function makeBlock(id, height, extra = {}) {
  return {
    id,
    height,
    timestamp: height * 5,
    totalAmount: 0,
    totalFee: 0,
    numberOfTransactions: 0,
    ...extra,
  };
}

describe('WebSocket block REST hydration', function () {
  let originalModules;

  beforeEach(function () {
    originalModules = new Map(
      [handlerPath, blocksPath, statisticsRequestsPath, apiPath, loggerPath].map((modulePath) => [
        modulePath,
        require.cache[modulePath],
      ]),
    );
  });

  afterEach(function () {
    for (const [modulePath, originalModule] of originalModules) {
      if (originalModule) {
        require.cache[modulePath] = originalModule;
      } else {
        delete require.cache[modulePath];
      }
    }

    global.setInterval = originalSetInterval;
    global.setTimeout = originalSetTimeout;
  });

  async function loadHandler({ idResponses, heightResponse }) {
    const initialBlock = makeBlock('block-100', 100);
    const idRequests = [];
    const heightRequests = [];
    const timeoutDelays = [];
    const logCalls = [];
    let blockListener;

    global.setInterval = () => ({ type: 'interval' });
    global.setTimeout = (callback, delay) => {
      timeoutDelays.push(delay);
      callback();
      return { type: 'timeout' };
    };

    require.cache[blocksPath] = {
      exports: {
        async getBlocksWindow() {
          return [initialBlock];
        },
        async getBlockById(id) {
          idRequests.push(id);
          const response = idResponses.shift();

          if (response instanceof Error || typeof response === 'string') {
            throw response;
          }

          return response;
        },
        async getBlockByHeight(height) {
          heightRequests.push(height);

          if (heightResponse instanceof Error || typeof heightResponse === 'string') {
            throw heightResponse;
          }

          return heightResponse;
        },
        onNewBlock(listener) {
          blockListener = listener;
          return () => {};
        },
      },
    };
    require.cache[statisticsRequestsPath] = { exports: {} };
    require.cache[apiPath] = {
      exports: {
        async waitForReady() {},
      },
    };
    require.cache[loggerPath] = {
      exports: Object.fromEntries(
        ['error', 'warn', 'info', 'log', 'debug'].map((level) => [
          level,
          (message) => logCalls.push({ level, message }),
        ]),
      ),
    };
    delete require.cache[handlerPath];

    const handler = require(handlerPath);
    await handler.startBlockStatisticsCache();

    return {
      emitBlock: (notification) => blockListener(notification),
      getCachedBlocks: handler.getCachedBlocks,
      heightRequests,
      idRequests,
      logCalls,
      timeoutDelays,
    };
  }

  it('retries a short Block not found miss without logging the first attempt', async function () {
    const hydrated = makeBlock('block-101', 101, { hydrated: true });
    const context = await loadHandler({
      idResponses: [new Error('Block not found'), { block: hydrated }],
    });

    await context.emitBlock(makeBlock('block-101', 101, { compact: true }));

    expect(context.idRequests).to.deep.equal(['block-101', 'block-101']);
    expect(context.heightRequests).to.deep.equal([]);
    expect(context.timeoutDelays).to.deep.equal([200]);
    expect(context.getCachedBlocks()[0]).to.equal(hydrated);
    expect(
      context.logCalls.filter(({ message }) => message.includes('REST confirmation')),
    ).to.deep.equal([]);
  });

  it('falls back to a matching height after both id confirmations miss', async function () {
    const hydrated = makeBlock('block-101', 101, { hydrated: true });
    const context = await loadHandler({
      idResponses: ['Block not found', new Error('Block not found')],
      heightResponse: { block: hydrated },
    });

    await context.emitBlock(makeBlock('block-101', 101, { compact: true }));

    expect(context.idRequests).to.deep.equal(['block-101', 'block-101']);
    expect(context.heightRequests).to.deep.equal([101]);
    expect(context.getCachedBlocks()[0]).to.equal(hydrated);
    expect(context.logCalls.some(({ level }) => level === 'warn')).to.equal(false);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'debug' &&
          message.includes('still unavailable after 2 REST confirmation attempts') &&
          message.includes('retrying with a height lookup') &&
          !message.includes('compact payload will be used'),
      ),
    ).to.have.length(1);
  });

  it('does not retry unrelated REST failures', async function () {
    const compact = makeBlock('block-101', 101, { compact: true });
    const context = await loadHandler({
      idResponses: [new Error('Connection timed out')],
    });

    await context.emitBlock(compact);

    expect(context.idRequests).to.deep.equal(['block-101']);
    expect(context.heightRequests).to.deep.equal([]);
    expect(context.timeoutDelays).to.deep.equal([]);
    expect(context.getCachedBlocks()[0]).to.equal(compact);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'warn' &&
          message.includes('REST confirmation exhausted') &&
          message.includes('compact payload will be used') &&
          message.includes('periodic REST reconciliation of the latest 100 blocks') &&
          message.includes('every 30000ms'),
      ),
    ).to.have.length(1);
    expect(
      context.logCalls.some(
        ({ level, message }) => level === 'debug' && message.includes('REST confirmation'),
      ),
    ).to.equal(false);
  });

  it('does not promise a height retry when the WebSocket height is unusable', async function () {
    const compact = {
      ...makeBlock('block-unknown', 101, { compact: true }),
      height: undefined,
    };
    const context = await loadHandler({
      idResponses: [new Error('Block not found'), new Error('Block not found')],
    });

    await context.emitBlock(compact);

    expect(context.idRequests).to.deep.equal(['block-unknown', 'block-unknown']);
    expect(context.heightRequests).to.deep.equal([]);
    expect(
      context.logCalls.filter(
        ({ level, message }) => level === 'debug' && message.includes('REST confirmation'),
      ),
    ).to.deep.equal([]);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'warn' &&
          message.includes('height=unknown') &&
          message.includes('compact payload will be used') &&
          message.includes('periodic REST reconciliation of the latest 100 blocks') &&
          message.includes('every 30000ms'),
      ),
    ).to.have.length(1);
  });

  it('logs retries at debug and exhausted Block not found confirmation at warn', async function () {
    const compact = makeBlock('block-101', 101, { compact: true });
    const context = await loadHandler({
      idResponses: [new Error('Block not found'), new Error('Block not found')],
      heightResponse: 'Block not found',
    });

    await context.emitBlock(compact);

    expect(context.idRequests).to.deep.equal(['block-101', 'block-101']);
    expect(context.heightRequests).to.deep.equal([101]);
    expect(context.getCachedBlocks()[0]).to.equal(compact);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'debug' &&
          message.includes('retrying with a height lookup') &&
          !message.includes('compact payload will be used'),
      ),
    ).to.have.length(1);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'warn' &&
          message.includes('compact payload will be used') &&
          message.includes('periodic REST reconciliation of the latest 100 blocks') &&
          message.includes('every 30000ms'),
      ),
    ).to.have.length(1);
  });

  it('logs an empty height fallback as the final warning and ingests compact data', async function () {
    const compact = makeBlock('block-101', 101, { compact: true });
    const context = await loadHandler({
      idResponses: [new Error('Block not found'), new Error('Block not found')],
      heightResponse: 'No block at height 101',
    });

    await context.emitBlock(compact);

    expect(context.heightRequests).to.deep.equal([101]);
    expect(context.getCachedBlocks()[0]).to.equal(compact);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'debug' &&
          message.includes('retrying with a height lookup') &&
          !message.includes('compact payload will be used'),
      ),
    ).to.have.length(1);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'warn' &&
          message.includes('compact payload will be used') &&
          message.includes('periodic REST reconciliation of the latest 100 blocks') &&
          message.includes('every 30000ms'),
      ),
    ).to.have.length(1);
  });

  it('rejects a height fallback that does not confirm the announced block id', async function () {
    const compact = makeBlock('block-101', 101, { compact: true });
    const context = await loadHandler({
      idResponses: [new Error('Block not found'), new Error('Block not found')],
      heightResponse: { block: makeBlock('different-block-101', 101) },
    });

    await context.emitBlock(compact);

    expect(context.heightRequests).to.deep.equal([101]);
    expect(context.getCachedBlocks()[0]).to.equal(compact);
    expect(
      context.logCalls.filter(
        ({ level, message }) =>
          level === 'warn' &&
          message.includes('compact payload will be used') &&
          message.includes('periodic REST reconciliation of the latest 100 blocks') &&
          message.includes('every 30000ms'),
      ),
    ).to.have.length(1);
  });
});
