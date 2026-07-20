import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const express = require('express');
const supertest = require('supertest');
const mountNetworkHealthRoute = require('../../api/routes/networkHealth.js');
const networkHealthHandler = require('../../api/lib/adamant/handlers/networkHealth.js');

const checkedAt = '2026-07-19T06:00:00.000Z';

function response(status, forgingDelegates) {
  return {
    success: status !== 'unavailable',
    status,
    height: status === 'unavailable' ? null : 53748068,
    forgingDelegates,
    activeDelegates: 101,
    checkedAt,
  };
}

describe('GET /api/networkHealth', function () {
  for (const [status, forgingDelegates] of [
    ['live', 80],
    ['degraded', 51],
    ['critical', 0],
  ]) {
    it(`returns HTTP 200 for a computed ${status} state`, async function () {
      const app = express();
      const body = response(status, forgingDelegates);

      mountNetworkHealthRoute(app, (error, success) =>
        networkHealthHandler.getNetworkHealth(error, success, {
          getSnapshot: async () => ({
            height: 53748068,
            forgingDelegates,
            activeDelegates: 101,
          }),
          isReady: () => true,
          now: () => new Date(checkedAt),
        }),
      );

      const result = await supertest(app).get('/api/networkHealth').expect(200);
      expect(result.body).to.deep.equal(body);
    });
  }

  it('returns the bounded unavailable payload with HTTP 503', async function () {
    const app = express();
    const body = response('unavailable', null);

    mountNetworkHealthRoute(app, (error, success) =>
      networkHealthHandler.getNetworkHealth(error, success, {
        getSnapshot: async () => {
          throw new Error('No coherent node snapshot');
        },
        isReady: () => true,
        now: () => new Date(checkedAt),
      }),
    );

    const result = await supertest(app).get('/api/networkHealth').expect(503);
    expect(result.body).to.deep.equal(body);
  });

  it('rejects query parameters before running the health calculation', async function () {
    const app = express();
    let calls = 0;

    mountNetworkHealthRoute(app, () => {
      calls++;
    });

    const result = await supertest(app).get('/api/networkHealth?details=true').expect(200);

    expect(result.body).to.deep.equal({
      success: false,
      error: 'Unexpected details query parameter',
    });
    expect(calls).to.equal(0);
  });

  it('returns unavailable immediately while the shared API is starting', async function () {
    const app = express();
    let snapshotCalls = 0;

    mountNetworkHealthRoute(app, (error, success) =>
      networkHealthHandler.getNetworkHealth(error, success, {
        getSnapshot: async () => {
          snapshotCalls++;
          return {};
        },
        isReady: () => false,
        now: () => new Date(checkedAt),
      }),
    );

    const result = await supertest(app).get('/api/networkHealth').expect(503);

    expect(result.body).to.deep.equal(response('unavailable', null));
    expect(snapshotCalls).to.equal(0);
  });
});
