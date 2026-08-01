'use strict';

const https = require('node:https');
const { normalizeHostHeader } = require('./httpSecurity');

const OSM_TILE_HOST = 'tile.openstreetmap.org';
/** Matches Network Monitor Leaflet `maxZoom` to bound the proxy surface. */
const MAX_ZOOM = 10;
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_CACHE_MAX_ENTRIES = 512;
const DEFAULT_RATE_LIMIT = 600;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_CLIENTS = 10_000;
const FALLBACK_REFERER = 'https://explorer.adamant.im/';

/**
 * Parse and validate slippy-map tile coordinates.
 *
 * Rejects non-decimal paths and coordinates outside the zoom tile grid so the
 * proxy cannot be steered at arbitrary upstream URLs.
 * @param {*} z Zoom level string from the route
 * @param {*} x Tile X string from the route
 * @param {*} y Tile Y string from the route
 * @returns {{z: number, x: number, y: number}|null} Valid coordinates, or `null`
 */
function parseTileCoordinates(z, x, y) {
  if (![z, x, y].every((value) => typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value))) {
    return null;
  }

  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);

  if (!Number.isInteger(zoom) || zoom < 0 || zoom > MAX_ZOOM) {
    return null;
  }

  const maxIndex = 2 ** zoom - 1;

  if (
    !Number.isInteger(tileX) ||
    !Number.isInteger(tileY) ||
    tileX < 0 ||
    tileY < 0 ||
    tileX > maxIndex ||
    tileY > maxIndex
  ) {
    return null;
  }

  return { z: zoom, x: tileX, y: tileY };
}

/**
 * Build the Referer sent to OpenStreetMap for policy compliance.
 *
 * Tor Browser hides Referer on `.onion` pages, so the browser cannot fetch
 * tiles directly. The explorer proxies tiles and supplies a same-site Referer
 * derived from the inbound request host. Host values are normalized with the
 * same helper used for CSP, and the protocol comes from Express `req.protocol`
 * so `trust proxy` is respected.
 * @param {import('express').Request} req Inbound tile request
 * @returns {string} Absolute Referer URL ending with `/`
 */
function buildTileReferer(req) {
  const host = normalizeHostHeader(req.get('host'));

  if (!host) {
    return FALLBACK_REFERER;
  }

  const protocol = req.protocol === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/`;
}

/**
 * Create a fixed-window per-IP limiter for tile proxy requests.
 * @param {Object} [options] Limiter options
 * @param {number} [options.limit=600] Requests allowed per client and window
 * @param {number} [options.windowMs=60000] Window duration in milliseconds
 * @param {number} [options.maxClients=10000] Maximum individually tracked identities
 * @param {() => number} [options.now=Date.now] Clock used by tests
 * @returns {import('express').RequestHandler} Rate-limit middleware
 */
function createOsmTileRateLimiter({
  limit = DEFAULT_RATE_LIMIT,
  windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
  maxClients = DEFAULT_RATE_LIMIT_MAX_CLIENTS,
  now = Date.now,
} = {}) {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new TypeError('OSM tile rate limit must be a positive safe integer');
  }

  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new TypeError('OSM tile rate-limit window must be a positive safe integer');
  }

  if (!Number.isSafeInteger(maxClients) || maxClients <= 0) {
    throw new TypeError('OSM tile rate-limit client cap must be a positive safe integer');
  }

  if (typeof now !== 'function') {
    throw new TypeError('OSM tile rate-limit clock must be a function');
  }

  const clients = new Map();
  let overflowState = null;
  let nextSweepAt = 0;

  return function osmTileRateLimiter(req, res, next) {
    const currentTime = now();

    if (currentTime >= nextSweepAt) {
      for (const [client, state] of clients) {
        if (state.resetAt <= currentTime) {
          clients.delete(client);
        }
      }

      nextSweepAt = currentTime + windowMs;
    }

    const client = req.ip || req.socket?.remoteAddress || 'unknown';
    let state = clients.get(client);

    if (!state || state.resetAt <= currentTime) {
      if (state) {
        clients.delete(client);
      }

      if (clients.size < maxClients) {
        state = {
          count: 0,
          resetAt: currentTime + windowMs,
        };
        clients.set(client, state);
      } else {
        if (!overflowState || overflowState.resetAt <= currentTime) {
          overflowState = {
            count: 0,
            resetAt: currentTime + windowMs,
          };
        }

        state = overflowState;
      }
    }

    state.count += 1;

    if (state.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((state.resetAt - currentTime) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('Cache-Control', 'no-store');
      return res.status(429).type('text/plain').send('Too many tile requests');
    }

    return next();
  };
}

/**
 * Create an in-process LRU cache for successful OSM tile bodies.
 * @param {number} maxEntries Maximum cached tiles
 * @returns {{get: Function, set: Function}} Cache helpers
 */
function createTileCache(maxEntries) {
  const entries = new Map();

  return {
    get(key) {
      const value = entries.get(key);

      if (!value) {
        return null;
      }

      entries.delete(key);
      entries.set(key, value);
      return value;
    },
    set(key, value) {
      if (entries.has(key)) {
        entries.delete(key);
      }

      entries.set(key, value);

      while (entries.size > maxEntries) {
        const oldestKey = entries.keys().next().value;
        entries.delete(oldestKey);
      }
    },
  };
}

/**
 * Copy selected upstream headers onto the client response.
 * @param {import('express').Response} res Client response
 * @param {Object} headers Upstream header map
 * @param {number} statusCode Upstream status code
 */
function applyTileResponseHeaders(res, headers, statusCode) {
  const contentType = headers['content-type'];
  if (typeof contentType === 'string' && contentType) {
    res.setHeader('Content-Type', contentType);
  }

  const etag = headers.etag;
  if (typeof etag === 'string' && etag) {
    res.setHeader('ETag', etag);
  }

  const lastModified = headers['last-modified'];
  if (typeof lastModified === 'string' && lastModified) {
    res.setHeader('Last-Modified', lastModified);
  }

  if (statusCode >= 200 && statusCode < 300) {
    const cacheControl = headers['cache-control'];
    if (typeof cacheControl === 'string' && cacheControl) {
      res.setHeader('Cache-Control', cacheControl);
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
}

/**
 * Create an Express handler that proxies raster tiles from OpenStreetMap.
 *
 * Identifies the explorer in `User-Agent` and always sends a valid `Referer`,
 * which OSM requires for browser-originated traffic. Only GET of validated
 * `{z}/{x}/{y}.png` paths is supported. Successful tiles are cached in process
 * memory; aborted client connections cancel the upstream fetch.
 * @param {Object} options Proxy options
 * @param {string} options.userAgent Identifiable User-Agent for OSM policy
 * @param {(req: import('express').Request) => string} [options.getReferer]
 *   Referer builder; defaults to {@link buildTileReferer}
 * @param {typeof https.request} [options.request] HTTPS request function (tests)
 * @param {number} [options.cacheMaxEntries=512] In-memory successful-tile LRU size
 * @returns {import('express').RequestHandler} Tile proxy middleware
 */
function createOsmTileProxy({
  userAgent,
  getReferer = buildTileReferer,
  request = https.request,
  cacheMaxEntries = DEFAULT_CACHE_MAX_ENTRIES,
} = {}) {
  if (typeof userAgent !== 'string' || !userAgent.trim()) {
    throw new TypeError('OSM tile proxy requires a non-empty userAgent');
  }

  if (typeof getReferer !== 'function') {
    throw new TypeError('OSM tile proxy getReferer must be a function');
  }

  if (typeof request !== 'function') {
    throw new TypeError('OSM tile proxy request must be a function');
  }

  if (!Number.isSafeInteger(cacheMaxEntries) || cacheMaxEntries < 0) {
    throw new TypeError('OSM tile cache size must be a non-negative safe integer');
  }

  const tileCache = cacheMaxEntries > 0 ? createTileCache(cacheMaxEntries) : null;

  return function osmTileProxy(req, res) {
    const coordinates = parseTileCoordinates(req.params.z, req.params.x, req.params.y);

    if (!coordinates) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).type('text/plain').send('Invalid tile coordinates');
    }

    const cacheKey = `${coordinates.z}/${coordinates.x}/${coordinates.y}`;
    const cached = tileCache?.get(cacheKey);

    if (cached) {
      res.status(cached.statusCode);
      applyTileResponseHeaders(res, cached.headers, cached.statusCode);
      return res.end(cached.body);
    }

    const upstreamPath = `/${coordinates.z}/${coordinates.x}/${coordinates.y}.png`;
    let outcomeSent = false;

    const fail = (status, message) => {
      if (res.writableFinished || outcomeSent) {
        return;
      }

      // Headers already flushed for a streaming success path: tear down instead
      // of leaving the client hanging until the HTTP server request timeout.
      if (res.headersSent) {
        outcomeSent = true;
        res.destroy();
        return;
      }

      outcomeSent = true;
      res.setHeader('Cache-Control', 'no-store');
      res.status(status).type('text/plain').send(message);
    };

    const upstream = request(
      {
        hostname: OSM_TILE_HOST,
        path: upstreamPath,
        method: 'GET',
        headers: {
          Accept: 'image/png,image/*;q=0.8,*/*;q=0.5',
          'User-Agent': userAgent,
          Referer: getReferer(req),
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
      (upstreamRes) => {
        if (outcomeSent || res.writableFinished) {
          upstreamRes.resume();
          return;
        }

        const statusCode = Number.isInteger(upstreamRes.statusCode) ? upstreamRes.statusCode : 502;
        const shouldCache = Boolean(tileCache) && statusCode >= 200 && statusCode < 300;

        if (!shouldCache) {
          res.status(statusCode);
          applyTileResponseHeaders(res, upstreamRes.headers, statusCode);
          upstreamRes.on('error', () => {
            fail(502, 'Tile upstream error');
          });
          upstreamRes.on('end', () => {
            outcomeSent = true;
          });
          upstreamRes.pipe(res);
          return;
        }

        const chunks = [];

        upstreamRes.on('data', (chunk) => {
          chunks.push(chunk);
        });

        upstreamRes.on('error', () => {
          fail(502, 'Tile upstream error');
        });

        upstreamRes.on('end', () => {
          if (outcomeSent || res.writableFinished || res.headersSent) {
            return;
          }

          outcomeSent = true;
          const body = Buffer.concat(chunks);
          tileCache.set(cacheKey, {
            statusCode,
            headers: {
              'content-type': upstreamRes.headers['content-type'],
              'cache-control': upstreamRes.headers['cache-control'],
              etag: upstreamRes.headers.etag,
              'last-modified': upstreamRes.headers['last-modified'],
            },
            body,
          });

          res.status(statusCode);
          applyTileResponseHeaders(res, upstreamRes.headers, statusCode);
          res.end(body);
        });
      },
    );
    const abortUpstream = () => {
      upstream.destroy();
    };

    res.on('close', () => {
      if (!res.writableFinished) {
        abortUpstream();
      }
    });

    upstream.on('timeout', () => {
      fail(504, 'Tile upstream timeout');
      abortUpstream();
    });

    upstream.on('error', () => {
      fail(502, 'Tile upstream error');
    });

    upstream.end();
  };
}

module.exports = {
  DEFAULT_CACHE_MAX_ENTRIES,
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  FALLBACK_REFERER,
  MAX_ZOOM,
  OSM_TILE_HOST,
  buildTileReferer,
  createOsmTileProxy,
  createOsmTileRateLimiter,
  parseTileCoordinates,
};
