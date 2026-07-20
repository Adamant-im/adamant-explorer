'use strict';

const https = require('node:https');

const OSM_TILE_HOST = 'tile.openstreetmap.org';
const MAX_ZOOM = 18;
const REQUEST_TIMEOUT_MS = 10_000;

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
  if (
    ![z, x, y].every((value) => typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value))
  ) {
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
 * derived from the inbound request host.
 * @param {import('express').Request} req Inbound tile request
 * @returns {string} Absolute Referer URL ending with `/`
 */
function buildTileReferer(req) {
  const host = req.get('host');

  if (!host) {
    return 'https://explorer.adamant.im/';
  }

  const forwarded = req.get('x-forwarded-proto');
  const protocol =
    forwarded === 'https' || forwarded === 'http' ? forwarded : req.secure ? 'https' : 'http';

  return `${protocol}://${host}/`;
}

/**
 * Create an Express handler that proxies raster tiles from OpenStreetMap.
 *
 * Identifies the explorer in `User-Agent` and always sends a valid `Referer`,
 * which OSM requires for browser-originated traffic. Only GET of validated
 * `{z}/{x}/{y}.png` paths is supported.
 * @param {Object} options Proxy options
 * @param {string} options.userAgent Identifiable User-Agent for OSM policy
 * @param {(req: import('express').Request) => string} [options.getReferer]
 *   Referer builder; defaults to {@link buildTileReferer}
 * @param {typeof https.request} [options.request] HTTPS request function (tests)
 * @returns {import('express').RequestHandler} Tile proxy middleware
 */
function createOsmTileProxy({ userAgent, getReferer = buildTileReferer, request = https.request }) {
  if (typeof userAgent !== 'string' || !userAgent.trim()) {
    throw new TypeError('OSM tile proxy requires a non-empty userAgent');
  }

  if (typeof getReferer !== 'function') {
    throw new TypeError('OSM tile proxy getReferer must be a function');
  }

  if (typeof request !== 'function') {
    throw new TypeError('OSM tile proxy request must be a function');
  }

  return function osmTileProxy(req, res) {
    const coordinates = parseTileCoordinates(req.params.z, req.params.x, req.params.y);

    if (!coordinates) {
      return res.status(400).type('text/plain').send('Invalid tile coordinates');
    }

    const upstreamPath = `/${coordinates.z}/${coordinates.x}/${coordinates.y}.png`;
    let settled = false;

    const fail = (status, message) => {
      if (settled || res.headersSent) {
        return;
      }

      settled = true;
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
        settled = true;

        const statusCode = Number.isInteger(upstreamRes.statusCode) ? upstreamRes.statusCode : 502;
        res.status(statusCode);

        const contentType = upstreamRes.headers['content-type'];
        if (typeof contentType === 'string' && contentType) {
          res.setHeader('Content-Type', contentType);
        }

        const cacheControl = upstreamRes.headers['cache-control'];
        if (typeof cacheControl === 'string' && cacheControl) {
          res.setHeader('Cache-Control', cacheControl);
        } else {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }

        upstreamRes.pipe(res);
      },
    );

    upstream.on('timeout', () => {
      upstream.destroy();
      fail(504, 'Tile upstream timeout');
    });

    upstream.on('error', () => {
      fail(502, 'Tile upstream error');
    });

    upstream.end();
  };
}

module.exports = {
  MAX_ZOOM,
  OSM_TILE_HOST,
  buildTileReferer,
  createOsmTileProxy,
  parseTileCoordinates,
};
