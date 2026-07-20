import { createRequire } from 'node:module';
import { expect } from 'chai';
import express from 'express';
import request from 'supertest';

const require = createRequire(import.meta.url);
const { isApiPath } = require('../../api/lib/adamant/helpers/http.js');
const { createApiRateLimiter } = require('../../modules/apiRateLimiter.js');

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

describe('API rate limiter', function () {
  it('matches only the API path segment', function () {
    expect(isApiPath('/api')).to.equal(true);
    expect(isApiPath('/api/getAccount')).to.equal(true);
    expect(isApiPath('/API/getAccount')).to.equal(true);
    expect(isApiPath('/apiary')).to.equal(false);
    expect(isApiPath('/socket.io')).to.equal(false);
    expect(isApiPath('/assets/app.js')).to.equal(false);
  });

  it('limits each client independently and exposes retry metadata', function () {
    let currentTime = 1_000;
    const limiter = createApiRateLimiter({
      limit: 2,
      windowMs: 60_000,
      now: () => currentTime,
    });

    function request(ip) {
      const req = { ip, path: '/api/networkHealth', socket: {} };
      const res = createResponse();
      let continued = false;

      limiter(req, res, () => {
        continued = true;
      });

      return { continued, res };
    }

    const first = request('192.0.2.1');
    const second = request('192.0.2.1');
    const limited = request('192.0.2.1');
    const otherClient = request('198.51.100.2');

    expect(first.continued).to.equal(true);
    expect(first.res.headers['RateLimit-Limit']).to.equal('2');
    expect(first.res.headers['RateLimit-Remaining']).to.equal('1');
    expect(second.continued).to.equal(true);
    expect(second.res.headers['RateLimit-Remaining']).to.equal('0');
    expect(limited.continued).to.equal(false);
    expect(limited.res.statusCode).to.equal(429);
    expect(limited.res.headers['Retry-After']).to.equal('60');
    expect(limited.res.body).to.deep.equal({
      success: false,
      error: 'Too many requests',
    });
    expect(otherClient.continued).to.equal(true);

    currentTime += 60_000;
    expect(request('192.0.2.1').continued).to.equal(true);
  });

  it('does not count static assets, SPA routes, or Socket.IO traffic', function () {
    const limiter = createApiRateLimiter({ limit: 1 });

    for (const path of ['/assets/app.js', '/address/U1', '/socket.io/']) {
      const res = createResponse();
      let continued = false;

      limiter({ ip: '192.0.2.1', path, socket: {} }, res, () => {
        continued = true;
      });

      expect(continued).to.equal(true);
      expect(res.headers).to.deep.equal({});
    }
  });

  it('bounds tracked identities and rate-limits excess clients together', function () {
    let currentTime = 1_000;
    const limiter = createApiRateLimiter({
      limit: 1,
      maxClients: 2,
      windowMs: 60_000,
      now: () => currentTime,
    });

    function send(ip) {
      const req = { ip, path: '/api/networkHealth', socket: {} };
      const res = createResponse();
      let continued = false;

      limiter(req, res, () => {
        continued = true;
      });

      return { continued, res };
    }

    expect(send('192.0.2.1').continued).to.equal(true);
    expect(send('192.0.2.2').continued).to.equal(true);
    expect(send('192.0.2.3').continued).to.equal(true);

    const overflowLimited = send('192.0.2.4');
    expect(overflowLimited.continued).to.equal(false);
    expect(overflowLimited.res.statusCode).to.equal(429);

    currentTime += 60_000;
    expect(send('192.0.2.4').continued).to.equal(true);
  });

  it('separates forwarded clients only when the immediate proxy is trusted', async function () {
    const proxiedApp = express();
    proxiedApp.set('trust proxy', ['loopback']);
    proxiedApp.use(createApiRateLimiter({ limit: 1 }));
    proxiedApp.get('/api/test', (req, res) => res.json({ ip: req.ip }));

    await request(proxiedApp)
      .get('/api/test')
      .set('X-Forwarded-For', '192.0.2.10')
      .expect(200, { ip: '192.0.2.10' });
    await request(proxiedApp)
      .get('/api/test')
      .set('X-Forwarded-For', '198.51.100.20')
      .expect(200, { ip: '198.51.100.20' });
    await request(proxiedApp).get('/api/test').set('X-Forwarded-For', '192.0.2.10').expect(429);

    const directApp = express();
    directApp.set('trust proxy', false);
    directApp.use(createApiRateLimiter({ limit: 1 }));
    directApp.get('/api/test', (req, res) => res.json({ ip: req.ip }));

    await request(directApp).get('/api/test').set('X-Forwarded-For', '192.0.2.10').expect(200);
    await request(directApp).get('/api/test').set('X-Forwarded-For', '198.51.100.20').expect(429);
  });
});
