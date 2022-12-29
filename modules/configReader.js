const jsonminify = require('jsonminify');
const fs = require('fs');
const isDev = process.argv.includes('dev');

let config = {};

// Validate config fields
const fields = {
  host: {
    type: String,
    default: '0.0.0.0',
    isRequired: true,
  },
  port: {
    type: Number,
    default: 6040,
    isRequired: true,
  },
  adamant: {
    type: Object,
    default: {host: '127.0.0.1', port: 36666},
    isRequired: true,
  },
  nodes_adm: {
    type: Array,
    isRequired: true,
  },
  freegeoip: {
    type: Object,
    default: {host: '127.0.0.1', port: 8080},
    isRequired: true,
  },
  redis: {
    type: Object,
    default: {username: '', password: '', host: '127.0.0.1', port: 6379, cacheTTL: 20},
    isRequired: true,
  },
  log_level: {
    type: String,
    default: 'log',
  },
  exchangeRates: {
    type: Object,
    default: {enabled: false, updateInterval: 30000},
  },
  marketWatcher: {
    type: Object,
    default: {enabled: false, candles: {updateInterval: 30000}, orders: {updateInterval: 15000}},
  },
  proposals: {
    type: Object,
    default: {enabled: false, updateInterval: 600000},
  },
};

try {
  if (isDev) {
    config = JSON.parse(jsonminify(fs.readFileSync('./config.test', 'utf-8')));
  } else {
    const configFile = fs.existsSync('./config.jsonc') ? './config.jsonc' : './config.default.jsonc';
    config = JSON.parse(jsonminify(fs.readFileSync(configFile, 'utf-8')));
  }

  Object.keys(fields).forEach((f) => {
    if (!config[f] && fields[f].isRequired) {
      exit(`Explorer's config is wrong. Field _${f}_ is not valid. Cannot start Explorer.`);
    } else if (!config[f] && config[f] !== 0 && fields[f].default) {
      config[f] = fields[f].default;
    }
    if (config[f] && fields[f].type !== config[f].__proto__.constructor) {
      exit(`Explorer's config is wrong. Field type _${f}_ is not valid, expected type is _${fields[f].type.name}_. Cannot start Explorer.`);
    }
  });

  console.info(`The explorer successfully read a config-file${isDev ? ' (dev)' : ''}.`);
} catch (e) {
  console.error('Error reading config: ' + e);
}

function exit(msg) {
  console.error(msg);
  process.exit(-1);
}

config.isDev = isDev;
module.exports = config;
