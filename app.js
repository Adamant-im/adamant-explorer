'use strict';

const express = require('express');
const path = require('path');
const program = require('commander');
const async = require('async');
const split = require('split');
const morgan = require('morgan');
const compression = require('compression');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const routes = require('./api');
const cache = require('./cache');
const packageJson = require('./package.json');
const utils = require('./utils');
const logger = require('./utils/log');
const config = require('./modules/configReader');

const app = express();

program
  .version(packageJson.version)
  .option('-c, --config <path>', 'config file path')
  .option('-p, --port <port>', 'listening port number')
  .option('-h, --host <ip>', 'listening host name or ip')
  .option('-rp, --redisPort <port>', 'redis port')
  .parse(process.argv);

app.set('host', program?.host ?? config.host);
app.set('port', program?.port ?? config.port);

if (program?.redisPort) {
  config.redis.port = program.redisPort;
}
const client = require('./redis')(config);

app.candles = new utils.candles(config, client);
app.exchange = new utils.exchange(config);
app.knownAddresses = new utils.knownAddresses();
app.orders = new utils.orders(config, client);

app.set('version', '0.3');
app.set('strict routing', true);
app.set('adamant address', `http://${config.adamant.host}:${config.adamant.port}`);
app.set(
  'freegeoip address',
  `http://${config.freegeoip.host}:${config.freegeoip.port}`,
);
app.set('exchange enabled', config.exchangeRates.enabled);

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  const ws_src = `ws://${req.get('host')}wss://${req.get('host')}`;
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'none'; default-src 'self'; connect-src 'self' " +
    ws_src +
    "; img-src 'self' https://*.tile.openstreetmap.org; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com",
  );
  return next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.locals.redis = client;
app.use((req, res, next) => {
  req.redis = client;
  return next();
});

app.use(
  morgan('combined', {
    skip: (req, res) => {
      return parseInt(res.statusCode) < 400;
    },
    stream: split().on('data', (data) => {
      logger.error(data);
    }),
  }),
);
app.use(
  morgan('combined', {
    skip: (req, res) => {
      return parseInt(res.statusCode) >= 400;
    },
    stream: split().on('data', (data) => {
      logger.info(data);
    }),
  }),
);

app.use(compression());

app.use(methodOverride('X-HTTP-Method-Override'));

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use((req, res, next) => {
  if (req.originalUrl.split('/')[1] !== 'api') {
    return next();
  }

  logger.info(req.originalUrl);

  if (req.originalUrl === undefined) {
    return next();
  }

  if (cache.cacheIgnoreList.indexOf(req.originalUrl) >= 0) {
    return next();
  } else {
    req.redis.get(req.originalUrl, (err, json) => {
      if (err) {
        logger.info(err);
        return next();
      } else if (json) {
        try {
          json = JSON.parse(json);
        } catch (e) {
          return next();
        }

        return res.json(json);
      } else {
        return next();
      }
    });
  }
});

logger.info('Loading routes...');

routes(app);

logger.info('Routes loaded');

app.use((req, res, next) => {
  logger.info(req.originalUrl.split('/')[1]);

  if (req.originalUrl.split('/')[1] !== 'api') {
    return next();
  }

  if (req.originalUrl === undefined) {
    return next();
  }

  if (cache.cacheIgnoreList.indexOf(req.originalUrl) >= 0) {
    return res.json(req.json);
  } else {
    req.redis.set(req.originalUrl, JSON.stringify(req.json), (err) => {
      if (err) {
        logger.info(err);
      } else {
        const ttl = cache.cacheTTLOverride[req.originalUrl] || config.cacheTTL;

        req.redis.send_command('EXPIRE', [req.originalUrl, ttl], (err) => {
          if (err) {
            logger.info(err);
          }
        });
      }
    });

    return res.json(req.json);
  }
});

app.get('*', (req, res, next) => {
  if (req.url.indexOf('api') !== 1) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    return next();
  }
});

async.parallel(
  [
    (cb) => {
      app.exchange.loadRates();
      cb(null);
    },
  ],
  () => {
    const server = app.listen(app.get('port'), app.get('host'), (err) => {
      if (err) {
        logger.info(err);
      } else {
        logger.info(
          'Adamant Explorer started at ' +
          app.get('host') +
          ':' +
          app.get('port'),
        );
        const io = new Server(server);
        require('./sockets')(app, io);
      }
    });
  },
);
