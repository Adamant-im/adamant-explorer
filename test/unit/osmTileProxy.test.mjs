import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { expect } from 'chai';
import { PassThrough } from 'node:stream';

const require = createRequire(import.meta.url);
const {
  buildTileReferer,
  createOsmTileProxy,
  createOsmTileRateLimiter,
  parseTileCoordinates,
} = require('../../modules/osmTileProxy.js');

describe('OSM tile proxy', function () {
  describe('parseTileCoordinates', function () {
    it('accepts coordinates inside the zoom grid', function () {
      expect(parseTileCoordinates('0', '0', '0')).to.deep.equal({ z: 0, x: 0, y: 0 });
      expect(parseTileCoordinates('2', '3', '1')).to.deep.equal({ z: 2, x: 3, y: 1 });
      expect(parseTileCoordinates('10', '1023', '512')).to.deep.equal({ z: 10, x: 1023, y: 512 });
    });

    it('rejects malformed or out-of-range coordinates', function () {
      for (const args of [
        ['01', '0', '0'],
        ['-1', '0', '0'],
        ['2', '4', '0'],
        ['2', '0', '4'],
        ['11', '0', '0'],
        ['1', 'x', '0'],
        [1, 0, 0],
      ]) {
        expect(parseTileCoordinates(...args)).to.equal(null);
      }
    });
  });

  describe('buildTileReferer', function () {
    it('uses Express req.protocol with a normalized Host', function () {
      const req = {
        protocol: 'https',
        get(name) {
          if (name === 'host') {
            return 'explorer2.adamant.im';
          }

          return undefined;
        },
      };

      expect(buildTileReferer(req)).to.equal('https://explorer2.adamant.im/');
    });

    it('falls back when Host is missing or unsafe', function () {
      const missingHost = {
        protocol: 'https',
        get() {
          return undefined;
        },
      };
      const unsafeHost = {
        protocol: 'http',
        get(name) {
          return name === 'host' ? 'example.com; script-src https://evil.example' : undefined;
        },
      };

      expect(buildTileReferer(missingHost)).to.equal('https://explorer.adamant.im/');
      expect(buildTileReferer(unsafeHost)).to.equal('https://explorer.adamant.im/');
    });
  });

  describe('createOsmTileRateLimiter', function () {
    it('returns 429 after the per-IP budget is exhausted', function () {
      const limiter = createOsmTileRateLimiter({ limit: 2, windowMs: 60_000, now: () => 1_000 });
      const responses = [];

      for (let index = 0; index < 3; index += 1) {
        let statusCode;
        const headers = {};
        const res = {
          setHeader(name, value) {
            headers[name.toLowerCase()] = value;
          },
          status(code) {
            statusCode = code;
            return this;
          },
          type() {
            return this;
          },
          send() {
            return this;
          },
        };

        limiter({ ip: '203.0.113.10' }, res, () => {
          responses.push({ statusCode: statusCode ?? 200, headers });
        });

        if (statusCode) {
          responses.push({ statusCode, headers });
        }
      }

      expect(responses.map((entry) => entry.statusCode)).to.deep.equal([200, 200, 429]);
      expect(responses[2].headers['retry-after']).to.equal('60');
      expect(responses[2].headers['cache-control']).to.equal('no-store');
    });
  });

  describe('createOsmTileProxy', function () {
    function createClientResponse() {
      const res = new PassThrough();
      const headers = {};
      let statusCode;

      res.status = (code) => {
        statusCode = code;
        return res;
      };
      res.setHeader = (name, value) => {
        headers[name.toLowerCase()] = value;
      };
      res.type = () => res;
      res.send = (message) => {
        res.end(message);
        return res;
      };
      Object.defineProperty(res, 'headersSent', {
        get() {
          return statusCode !== undefined || res.writableFinished;
        },
      });

      return {
        res,
        headers,
        getStatus: () => statusCode,
      };
    }

    it('returns 400 for invalid tile paths without calling upstream', function () {
      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test',
        cacheMaxEntries: 0,
        request() {
          throw new Error('upstream must not be called');
        },
      });

      const { res, headers, getStatus } = createClientResponse();

      return new Promise((resolve, reject) => {
        res.on('finish', () => {
          try {
            expect(getStatus()).to.equal(400);
            expect(headers['cache-control']).to.equal('no-store');
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        proxy({ params: { z: '2', x: '9', y: '0' } }, res);
      });
    });

    it('forwards a successful upstream PNG with validators and caches the body', function () {
      let upstreamCalls = 0;
      const upstreamBody = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test (+https://explorer.adamant.im)',
        getReferer() {
          return 'https://explorer2.adamant.im/';
        },
        cacheMaxEntries: 8,
        request(options, onResponse) {
          upstreamCalls += 1;
          const upstreamRes = new PassThrough();
          upstreamRes.statusCode = 200;
          upstreamRes.headers = {
            'content-type': 'image/png',
            'cache-control': 'public, max-age=3600',
            etag: '"tile-1"',
            'last-modified': 'Mon, 20 Jul 2026 00:00:00 GMT',
          };

          queueMicrotask(() => {
            onResponse(upstreamRes);
            upstreamRes.end(upstreamBody);
          });

          const req = new EventEmitter();
          req.end = () => {};
          req.destroy = () => {};
          return req;
        },
      });

      function requestOnce() {
        const { res, headers, getStatus } = createClientResponse();
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));

        return new Promise((resolve, reject) => {
          res.on('finish', () => {
            try {
              resolve({
                statusCode: getStatus(),
                headers,
                body: Buffer.concat(chunks),
              });
            } catch (error) {
              reject(error);
            }
          });

          proxy({ params: { z: '1', x: '0', y: '0' } }, res);
        });
      }

      return requestOnce().then((first) => {
        expect(first.statusCode).to.equal(200);
        expect(first.headers['content-type']).to.equal('image/png');
        expect(first.headers['cache-control']).to.equal('public, max-age=3600');
        expect(first.headers.etag).to.equal('"tile-1"');
        expect(first.headers['last-modified']).to.equal('Mon, 20 Jul 2026 00:00:00 GMT');
        expect(first.body).to.deep.equal(upstreamBody);
        expect(upstreamCalls).to.equal(1);

        return requestOnce().then((second) => {
          expect(second.statusCode).to.equal(200);
          expect(second.body).to.deep.equal(upstreamBody);
          expect(upstreamCalls).to.equal(1);
        });
      });
    });

    it('uses no-store for unsuccessful upstream responses without a Cache-Control header', function () {
      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test',
        cacheMaxEntries: 0,
        getReferer() {
          return 'https://explorer.adamant.im/';
        },
        request(_options, onResponse) {
          const upstreamRes = new PassThrough();
          upstreamRes.statusCode = 429;
          upstreamRes.headers = { 'content-type': 'text/plain' };

          queueMicrotask(() => {
            onResponse(upstreamRes);
            upstreamRes.end('slow down');
          });

          const req = new EventEmitter();
          req.end = () => {};
          req.destroy = () => {};
          return req;
        },
      });

      const { res, headers, getStatus } = createClientResponse();
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));

      return new Promise((resolve, reject) => {
        res.on('finish', () => {
          try {
            expect(getStatus()).to.equal(429);
            expect(headers['cache-control']).to.equal('no-store');
            expect(Buffer.concat(chunks).toString()).to.equal('slow down');
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        proxy({ params: { z: '1', x: '0', y: '0' } }, res);
      });
    });

    it('returns 504 when the upstream request times out before headers', function () {
      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test',
        cacheMaxEntries: 0,
        getReferer() {
          return 'https://explorer.adamant.im/';
        },
        request() {
          const req = new EventEmitter();
          req.end = () => {};
          req.destroy = () => {
            req.emit('error', new Error('destroyed'));
          };
          queueMicrotask(() => {
            req.emit('timeout');
          });
          return req;
        },
      });

      const { res, headers, getStatus } = createClientResponse();

      return new Promise((resolve, reject) => {
        res.on('finish', () => {
          try {
            expect(getStatus()).to.equal(504);
            expect(headers['cache-control']).to.equal('no-store');
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        proxy({ params: { z: '1', x: '0', y: '0' } }, res);
      });
    });

    it('destroys the client response when upstream fails after headers are sent', function () {
      let upstreamReq;
      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test',
        cacheMaxEntries: 0,
        getReferer() {
          return 'https://explorer.adamant.im/';
        },
        request(_options, onResponse) {
          upstreamReq = new EventEmitter();
          upstreamReq.end = () => {};
          upstreamReq.destroy = () => {};

          const upstreamRes = new PassThrough();
          upstreamRes.statusCode = 200;
          upstreamRes.headers = { 'content-type': 'image/png' };

          queueMicrotask(() => {
            onResponse(upstreamRes);
            upstreamRes.write(Buffer.from([0x89, 0x50]));
            upstreamReq.emit('error', new Error('socket hang up'));
          });

          return upstreamReq;
        },
      });

      const { res, getStatus } = createClientResponse();
      let destroyed = false;
      res.destroy = () => {
        destroyed = true;
        if (!res.destroyed) {
          res.emit('close');
        }
      };

      return new Promise((resolve, reject) => {
        const check = () => {
          try {
            expect(getStatus()).to.equal(200);
            expect(destroyed).to.equal(true);
            resolve();
          } catch (error) {
            reject(error);
          }
        };

        res.on('close', check);
        proxy({ params: { z: '1', x: '0', y: '0' } }, res);
      });
    });

    it('aborts the upstream request when the client disconnects', function () {
      let destroyed = false;
      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test',
        cacheMaxEntries: 0,
        getReferer() {
          return 'https://explorer.adamant.im/';
        },
        request() {
          const req = new EventEmitter();
          req.end = () => {};
          req.destroy = () => {
            destroyed = true;
          };
          return req;
        },
      });

      const { res } = createClientResponse();
      proxy({ params: { z: '1', x: '0', y: '0' } }, res);
      res.emit('close');
      expect(destroyed).to.equal(true);
    });
  });
});
