const fs = require('fs');
const config = require('../modules/configReader');

// Verbosity thresholds, ordered from quietest to noisiest
const LOG_LEVELS = ['none', 'error', 'warn', 'info', 'log', 'debug'];

const COLORS = {
  error: '\x1b[31m', // red
  warn: '\x1b[33m', // yellow
  info: '\x1b[32m', // green
  log: '\x1b[34m', // blue
  debug: '\x1b[36m', // cyan
};

const RESET_COLOR = '\x1b[0m';

const configuredLevel = LOG_LEVELS.includes(config.log_level)
  ? LOG_LEVELS.indexOf(config.log_level)
  : LOG_LEVELS.indexOf('log');

if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs');
}

const logFile = fs.createWriteStream(`./logs/${date()}.log`, {
  flags: 'a',
});

logFile.write(`\n\n[The explorer started] _________________${fullTime()}_________________\n`);

/**
 * Write a message to the console and the log file when the given
 * severity passes the configured `log_level` threshold.
 * @param {'error'|'warn'|'info'|'log'|'debug'} level Message severity
 * @param {string} message Message to write; secrets must never be logged
 */
function write(level, message) {
  if (LOG_LEVELS.indexOf(level) > configuredLevel) {
    return;
  }

  console.log(COLORS[level], `${level}|${fullTime()}`, RESET_COLOR, message);
  logFile.write(`\n ${level}|${fullTime()}|${message}`);
}

/**
 * Explorer logger. Writes colored messages to the console and appends
 * plain-text lines to a daily file in `./logs/`.
 *
 * Verbosity is controlled by the `log_level` config field:
 * `none` < `error` < `warn` < `info` < `log` < `debug`.
 */
module.exports = {
  error: (message) => write('error', message),
  warn: (message) => write('warn', message),
  info: (message) => write('info', message),
  log: (message) => write('log', message),
  debug: (message) => write('debug', message),
};

/**
 * Format the current date as `YYYY-MM-DD`. Used for daily log file names.
 * @returns {string} Formatted date
 */
function date() {
  return formatDate(Date.now()).YYYY_MM_DD;
}

/**
 * Format the current date and time as `YYYY-MM-DD hh:mm:ss`.
 * @returns {string} Formatted date and time
 */
function fullTime() {
  const formatted = formatDate(Date.now());
  return `${formatted.YYYY_MM_DD} ${formatted.hh_mm_ss}`;
}

/**
 * Build zero-padded date and time strings from a timestamp.
 * @param {number} timestamp Unix timestamp in milliseconds
 * @returns {{YYYY_MM_DD: string, hh_mm_ss: string}} Formatted date parts
 */
function formatDate(timestamp) {
  const dateObject = new Date(timestamp);

  const year = dateObject.getFullYear();
  const month = `0${dateObject.getMonth() + 1}`.slice(-2);
  const day = `0${dateObject.getDate()}`.slice(-2);
  const hours = `0${dateObject.getHours()}`.slice(-2);
  const minutes = `0${dateObject.getMinutes()}`.slice(-2);
  const seconds = `0${dateObject.getSeconds()}`.slice(-2);

  return {
    YYYY_MM_DD: `${year}-${month}-${day}`,
    hh_mm_ss: `${hours}:${minutes}:${seconds}`,
  };
}
