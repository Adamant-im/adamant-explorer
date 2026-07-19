import { createRequire } from 'node:module';
import { expect } from 'chai';
import express from 'express';
import request from 'supertest';

const require = createRequire(import.meta.url);
const { createApiRateLimiter } = require('../../modules/apiRateLimiter.js');
const { guardApiSurface } = require('../../modules/apiSurface.js');

describe('Explorer API surface guard', function () {
  it('rejects removed and mixed-case routes before cache or readiness middleware', async function () {
    const app = express();
    let downstreamCalls = 0;

    app.set('case sensitive routing', true);
    app.use(createApiRateLimiter());
    app.use(guardApiSurface);
    app.use((req, res, next) => {
      downstreamCalls++;
      return next();
    });
    app.get('/api/getAccount', (req, res) => res.json({ success: true }));

    await request(app).get('/api/getPriceTicker').expect(404, {
      success: false,
      error: 'API endpoint not found',
    });
    await request(app).get('/API/getAccount').expect('RateLimit-Limit', '300').expect(404, {
      success: false,
      error: 'API endpoint not found',
    });

    expect(downstreamCalls).to.equal(0);

    await request(app).get('/api/getAccount').expect(200, { success: true });
    expect(downstreamCalls).to.equal(1);
  });

  it('rejects unsupported methods without delaying on upstream services', async function () {
    const app = express();
    let downstreamCalled = false;

    app.use(guardApiSurface);
    app.use(() => {
      downstreamCalled = true;
    });

    await request(app).post('/api/networkHealth').expect(404);
    expect(downstreamCalled).to.equal(false);
  });
});
