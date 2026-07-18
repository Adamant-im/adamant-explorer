'use strict';

const path = require('path');
const express = require('express');
const { program } = require('commander');
const morgan = require('morgan');
const compression = require('compression');
const { Server } = require('socket.io');

const routes = require('./api/routes');
const cache = require('./cache');
const adamantApi = require('./api/lib/adamant/requests/api');
const statisticsHandler = require('./api/lib/adamant/handlers/statistics');
const createAdamantApiReadinessMiddleware = require('./api/lib/adamant/middleware/readiness');
const packageJson = require('./package.json');
const utils = require('./utils');
const logger = require('./utils/log');
const { createHttpLogFormatter } = require('./utils/httpLogging');
const config = require('./modules/configReader');

const app = express();

program
  .version(packageJson.version)
  .option('-p, --port <port>', 'listening port number')
  .option('-h, --host <ip>', 'listening host name or IP address')
  .parse(process.argv);

const cliOptions = program.opts();

app.set('host', cliOptions.host ?? config.host);
app.set('port', cliOptions.port ?? config.port);

const client = require('./redis')(config);

app.exchange = new utils.exchange(config);

app.set('version', packageJson.version);
app.set('strict routing', true);
app.set('exchange enabled', config.exchangeRates.enabled);

// Security headers. The CSP allows only self-hosted resources, the explorer's
// own WebSocket endpoint, and OpenStreetMap tiles for the network map.
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const wsSrc = `ws://${req.get('host')} wss://${req.get('host')}`;

  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'none'; default-src 'self'; connect-src 'self' " +
      wsSrc +
      "; img-src 'self' https://*.tile.openstreetmap.org data:; style-src 'self' 'unsafe-inline'; font-src 'self'",
  );

  return next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Share the Redis client with routes through the request object
app.locals.redis = client;
app.use((req, res, next) => {
  req.redis = client;
  return next();
});

// Keep routine access logs at debug while surfacing client and server failures.
// Query strings are omitted because they may contain user-supplied identifiers.
app.use(morgan(createHttpLogFormatter(logger)));

app.use(compression());

// The API is public and read-only, so allow cross-origin GET requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  return next();
});

// Cache lookup: serve a cached API response when one exists
app.use(async (req, res, next) => {
  if (!req.originalUrl.startsWith('/api')) {
    return next();
  }

  const latestBlock = statisticsHandler.getCachedBlocks()[0];
  req.cacheKey = cache.getCacheKey(req.originalUrl, req.path, latestBlock);

  if (!req.cacheKey) {
    return next();
  }

  try {
    const json = await req.redis.get(req.cacheKey);

    if (json) {
      logger.debug(`API cache: Hit for ${req.method} ${req.path}`);
      return res.json(JSON.parse(json));
    }

    logger.debug(`API cache: Miss for ${req.method} ${req.path}`);
  } catch (error) {
    logger.warn(
      `API cache: Redis read failed for ${req.method} ${req.path}; continuing without cache: ${error}`,
    );
  }

  return next();
});

app.use(createAdamantApiReadinessMiddleware(adamantApi));

logger.debug('Explorer startup: Registering API routes');

routes(app);

logger.debug('Explorer startup: API routes registered');

// Cache store: routes that support caching call next() with the response in req.json
app.use((req, res, next) => {
  if (!req.originalUrl.startsWith('/api')) {
    return next();
  }

  if (req.cacheKey) {
    const ttl = cache.cacheTTLOverride[req.path] ?? config.redis.cacheTTL;

    req.redis
      .set(req.cacheKey, JSON.stringify(req.json), { expiration: { type: 'EX', value: ttl } })
      .then(() => {
        logger.debug(`API cache: Stored ${req.method} ${req.path}; ttl=${ttl}s`);
      })
      .catch((error) => {
        logger.warn(
          `API cache: Redis write failed for ${req.method} ${req.path}; ttl=${ttl}s: ${error}`,
        );
      });
  }

  return res.json(req.json);
});

// Serve the single-page application for any non-API path
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }

  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initial rates load runs in the background; the periodic update
// is scheduled by the Exchange constructor
app.exchange.loadRates();

const server = app.listen(app.get('port'), app.get('host'), (err) => {
  if (err) {
    logger.error(
      `Explorer startup: Failed to listen on ${app.get('host')}:${app.get('port')}: ${err}`,
    );
  } else {
    logger.info(
      `Explorer startup: v${app.get('version')} listening on ${app.get('host')}:${app.get('port')}; ` +
        `nodes=${config.nodes_adm.length}; exchangeRates=${config.exchangeRates.enabled ? 'enabled' : 'disabled'}; ` +
        `logLevel=${config.log_level}`,
    );

    const io = new Server(server);
    require('./sockets')(app, io);
    statisticsHandler.startBlockStatisticsCache(client).catch((error) => {
      logger.warn(
        `Explorer startup: Block statistics cache initialization failed; background recovery remains active: ${error}`,
      );
    });
    statisticsHandler.startPeerStatisticsCache(client).catch((error) => {
      logger.warn(
        `Explorer startup: Peer statistics cache initialization failed; background retry remains active: ${error}`,
      );
    });
  }
});
