import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { expect } from 'chai';
import { PassThrough } from 'node:stream';

const require = createRequire(import.meta.url);
const {
  buildTileReferer,
  createOsmTileProxy,
  parseTileCoordinates,
} = require('../../modules/osmTileProxy.js');

describe('OSM tile proxy', function () {
  describe('parseTileCoordinates', function () {
    it('accepts coordinates inside the zoom grid', function () {
      expect(parseTileCoordinates('0', '0', '0')).to.deep.equal({ z: 0, x: 0, y: 0 });
      expect(parseTileCoordinates('2', '3', '1')).to.deep.equal({ z: 2, x: 3, y: 1 });
    });

    it('rejects malformed or out-of-range coordinates', function () {
      for (const args of [
        ['01', '0', '0'],
        ['-1', '0', '0'],
        ['2', '4', '0'],
        ['2', '0', '4'],
        ['19', '0', '0'],
        ['1', 'x', '0'],
        [1, 0, 0],
      ]) {
        expect(parseTileCoordinates(...args)).to.equal(null);
      }
    });
  });

  describe('buildTileReferer', function () {
    it('prefers X-Forwarded-Proto when present', function () {
      const req = {
        secure: false,
        get(name) {
          if (name === 'host') {
            return 'explorer2.adamant.im';
          }

          if (name === 'x-forwarded-proto') {
            return 'https';
          }

          return undefined;
        },
      };

      expect(buildTileReferer(req)).to.equal('https://explorer2.adamant.im/');
    });

    it('falls back to the public explorer origin without a Host header', function () {
      const req = {
        secure: true,
        get() {
          return undefined;
        },
      };

      expect(buildTileReferer(req)).to.equal('https://explorer.adamant.im/');
    });
  });

  describe('createOsmTileProxy', function () {
    it('returns 400 for invalid tile paths without calling upstream', function () {
      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test',
        request() {
          throw new Error('upstream must not be called');
        },
      });

      let statusCode;
      let body;
      const res = {
        status(code) {
          statusCode = code;
          return this;
        },
        type() {
          return this;
        },
        send(message) {
          body = message;
          return this;
        },
      };

      proxy({ params: { z: '2', x: '9', y: '0' } }, res);
      expect(statusCode).to.equal(400);
      expect(body).to.equal('Invalid tile coordinates');
    });

    it('forwards a successful upstream PNG with policy headers', function () {
      let capturedOptions;
      const upstreamBody = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

      const proxy = createOsmTileProxy({
        userAgent: 'ADAMANT-Explorer/test (+https://explorer.adamant.im)',
        getReferer() {
          return 'https://explorer2.adamant.im/';
        },
        request(options, onResponse) {
          capturedOptions = options;
          const upstreamRes = new PassThrough();
          upstreamRes.statusCode = 200;
          upstreamRes.headers = {
            'content-type': 'image/png',
            'cache-control': 'public, max-age=3600',
          };

          queueMicrotask(() => {
            onResponse(upstreamRes);
            upstreamRes.end(upstreamBody);
          });

          const req = new EventEmitter();
          req.end = () => {};
          return req;
        },
      });

      const chunks = [];
      let statusCode;
      const headers = {};
      const res = new PassThrough();
      res.status = (code) => {
        statusCode = code;
        return res;
      };
      res.setHeader = (name, value) => {
        headers[name.toLowerCase()] = value;
      };
      res.on('data', (chunk) => chunks.push(chunk));

      return new Promise((resolve, reject) => {
        res.on('finish', () => {
          try {
            expect(capturedOptions).to.deep.include({
              hostname: 'tile.openstreetmap.org',
              path: '/1/0/0.png',
              method: 'GET',
            });
            expect(capturedOptions.headers['User-Agent']).to.equal(
              'ADAMANT-Explorer/test (+https://explorer.adamant.im)',
            );
            expect(capturedOptions.headers.Referer).to.equal('https://explorer2.adamant.im/');
            expect(statusCode).to.equal(200);
            expect(headers['content-type']).to.equal('image/png');
            expect(headers['cache-control']).to.equal('public, max-age=3600');
            expect(Buffer.concat(chunks)).to.deep.equal(upstreamBody);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        proxy({ params: { z: '1', x: '0', y: '0' } }, res);
      });
    });
  });
});
