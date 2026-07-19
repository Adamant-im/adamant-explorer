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
const { isApiPath, isSupportedApiPath } = require('./api/lib/adamant/helpers/http');
const { createApiRateLimiter } = require('./modules/apiRateLimiter');
const { guardApiSurface } = require('./modules/apiSurface');
const { normalizePort } = require('./modules/configValidation');
const { buildContentSecurityPolicy } = require('./modules/httpSecurity');
const config = require('./modules/configReader');

const app = express();

program
  .version(packageJson.version)
  .option('-p, --port <port>', 'listening port number')
  .option('-h, --host <ip>', 'listening host name or IP address')
  .parse(process.argv);

const cliOptions = program.opts();
let listeningPort = config.port;

if (cliOptions.port !== undefined) {
  try {
    listeningPort = normalizePort(cliOptions.port);
  } catch (error) {
    program.error(error.message);
  }
}

app.set('host', cliOptions.host ?? config.host);
app.set('port', listeningPort);
app.set('trust proxy', config.trustedProxies);
app.disable('x-powered-by');

const client = require('./redis')(config);

app.exchange = new utils.exchange(config);

app.set('version', packageJson.version);
app.set('strict routing', true);
app.set('case sensitive routing', true);
app.set('exchange enabled', config.exchangeRates.enabled);

// Security headers allow self-hosted application resources and the fixed
// OpenStreetMap tile origin used by Network Monitor.
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  );

  res.setHeader('Content-Security-Policy', buildContentSecurityPolicy(req.get('host')));

  return next();
});

app.use(
  express.static(path.join(__dirname, 'public'), {
    dotfiles: 'deny',
  }),
);

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

app.use(createApiRateLimiter());

app.use(guardApiSurface);

// Cache lookup: serve a cached API response when one exists
app.use(async (req, res, next) => {
  if (req.method !== 'GET' || !isSupportedApiPath(req.path)) {
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
  if (req.method !== 'GET' || !isSupportedApiPath(req.path) || req.json === undefined) {
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

app.use((req, res, next) => {
  if (!isApiPath(req.path)) {
    return next();
  }

  return res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// Serve the single-page application for any non-API path
app.use((req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    return next();
  }

  return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Keep internal error details in operational logs and return a stable response.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  logger.error(`HTTP: Unhandled ${req.method} ${req.path}: ${error}`);

  return res.status(503).json({
    success: false,
    error: 'Service temporarily unavailable',
  });
});

// Initial rates load runs in the background; the periodic update
// is scheduled by the Exchange constructor
app.exchange.loadRates();

const server = app.listen(app.get('port'), app.get('host'), () => {
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
});

// Bound slow or incomplete HTTP requests even when Explorer is exposed
// without the recommended reverse proxy. Upgraded Socket.IO connections are
// not governed by these HTTP request timers.
server.headersTimeout = 15_000;
server.requestTimeout = 30_000;
server.keepAliveTimeout = 5_000;

server.once('error', (error) => {
  logger.error(
    `Explorer startup: Failed to listen on ${app.get('host')}:${app.get('port')}: ${error}`,
  );
  process.exit(1);
});
