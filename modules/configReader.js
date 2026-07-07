const fs = require('fs');
const jsonminify = require('jsonminify');

// `node app.js dev` runs the explorer with the testnet config
const isDev = process.argv.includes('dev');

/**
 * Expected config fields.
 * A field with `isRequired` must be present in the config file;
 * other fields fall back to `default` when omitted.
 */
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
  nodes_adm: {
    type: Array,
    isRequired: true,
  },
  freegeoip: {
    type: Object,
    default: { host: '127.0.0.1', port: 8080 },
    isRequired: true,
  },
  redis: {
    type: Object,
    default: { username: '', password: '', host: '127.0.0.1', port: 6379, cacheTTL: 20 },
    isRequired: true,
  },
  log_level: {
    type: String,
    default: 'log',
  },
  exchangeRates: {
    type: Object,
    default: { enabled: false, updateInterval: 30000 },
  },
};

/**
 * Log a config error and stop the process: the explorer
 * cannot run with an invalid configuration.
 * @param {string} msg Reason the config is invalid
 */
function exit(msg) {
  console.error(msg);
  process.exit(-1);
}

let config = {};

try {
  let configFile;

  if (isDev) {
    configFile = './config.test.jsonc';
  } else {
    configFile = fs.existsSync('./config.jsonc') ? './config.jsonc' : './config.default.jsonc';
  }

  config = JSON.parse(jsonminify(fs.readFileSync(configFile, 'utf-8')));

  Object.keys(fields).forEach((field) => {
    const { type, default: defaultValue, isRequired } = fields[field];

    if (config[field] === undefined || config[field] === null) {
      if (isRequired && defaultValue === undefined) {
        exit(
          `Explorer config is wrong: required field _${field}_ is missing. Cannot start the explorer.`,
        );
      }

      config[field] = defaultValue;
    }

    if (config[field].constructor !== type) {
      exit(
        `Explorer config is wrong: field _${field}_ must be of type _${type.name}_. Cannot start the explorer.`,
      );
    }
  });

  console.info(
    `The explorer successfully read the ${configFile} config file${isDev ? ' (dev)' : ''}.`,
  );
} catch (e) {
  exit(`Error reading config: ${e}`);
}

config.isDev = isDev;

module.exports = config;
