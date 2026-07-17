const fs = require('fs');
const jsonminify = require('jsonminify');
const { validateGeoLocationConfig } = require('./configValidation');

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
  geoLocation: {
    type: Object,
    default: { enabled: true, provider: 'geojs', timeout: 5000 },
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
        exit(`Explorer config: Required field "${field}" is missing; startup aborted`);
      }

      config[field] = defaultValue;
    }

    if (config[field].constructor !== type) {
      exit(
        `Explorer config: Field "${field}" must be ${type.name}; received ${config[field].constructor.name}; startup aborted`,
      );
    }
  });

  const geoLocationError = validateGeoLocationConfig(config.geoLocation);

  if (geoLocationError) {
    exit(`Explorer config: ${geoLocationError}; startup aborted`);
  }

  console.info(
    `Explorer config: Loaded ${configFile}; mode=${isDev ? 'development' : 'production'}; ` +
      `nodes=${config.nodes_adm.length}; port=${config.port}; logLevel=${config.log_level}; ` +
      `exchangeRates=${config.exchangeRates.enabled ? 'enabled' : 'disabled'}; ` +
      `geoLocation=${config.geoLocation.enabled ? config.geoLocation.provider : 'disabled'}`,
  );
} catch (e) {
  exit(`Explorer config: Failed to read or validate configuration; startup aborted: ${e}`);
}

config.isDev = isDev;

module.exports = config;
