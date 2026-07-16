const fs = require('fs');
const path = require('path');

/** Verbosity thresholds ordered from quietest to noisiest. */
const LOG_LEVELS = ['none', 'error', 'warn', 'info', 'log', 'debug'];
const DEFAULT_LOG_LEVEL = 'log';

const COLORS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[32m',
  log: '\x1b[34m',
  debug: '\x1b[36m',
};

const RESET_COLOR = '\x1b[0m';

/**
 * Build a logger with an explicit threshold and log directory.
 *
 * Unknown levels fall back to `log`. The non-enumerable `close()` method is
 * intended for tests and one-shot scripts that need to flush the file stream.
 *
 * @param {Object} [options] Logger options
 * @param {string} [options.level='log'] Configured verbosity threshold
 * @param {string} [options.logDirectory='./logs'] Destination directory
 * @param {{log: Function}} [options.consoleOutput=console] Console sink
 * @param {() => number} [options.now=Date.now] Millisecond clock
 * @returns {{error: Function, warn: Function, info: Function, log: Function, debug: Function}}
 *   Logger methods ordered by increasing verbosity
 */
function createLogger({
  level = DEFAULT_LOG_LEVEL,
  logDirectory = './logs',
  consoleOutput = console,
  now = Date.now,
} = {}) {
  const effectiveLevel = LOG_LEVELS.includes(level) ? level : DEFAULT_LOG_LEVEL;
  const configuredLevel = LOG_LEVELS.indexOf(effectiveLevel);

  fs.mkdirSync(logDirectory, { recursive: true });

  const startedAt = now();
  const logFile = fs.createWriteStream(
    path.join(logDirectory, `${formatDate(startedAt).YYYY_MM_DD}.log`),
    { flags: 'a' },
  );

  logFile.write(
    `\n\n[Explorer process started] time=${fullTime(startedAt)}; pid=${process.pid}; logLevel=${effectiveLevel}\n`,
  );

  /** Write one message when its severity passes the configured threshold. */
  function write(messageLevel, message) {
    if (LOG_LEVELS.indexOf(messageLevel) > configuredLevel) {
      return;
    }

    const timestamp = fullTime(now());
    consoleOutput.log(COLORS[messageLevel], `${messageLevel}|${timestamp}`, RESET_COLOR, message);
    logFile.write(`\n ${messageLevel}|${timestamp}|${message}`);
  }

  const logger = {
    error: (message) => write('error', message),
    warn: (message) => write('warn', message),
    info: (message) => write('info', message),
    log: (message) => write('log', message),
    debug: (message) => write('debug', message),
  };

  Object.defineProperty(logger, 'close', {
    enumerable: false,
    value: () =>
      new Promise((resolve, reject) => {
        logFile.once('error', reject);
        logFile.end(resolve);
      }),
  });

  return logger;
}

/** Format a timestamp as `YYYY-MM-DD hh:mm:ss`. */
function fullTime(timestamp) {
  const formatted = formatDate(timestamp);
  return `${formatted.YYYY_MM_DD} ${formatted.hh_mm_ss}`;
}

/**
 * Build zero-padded local date and time strings from a timestamp.
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

module.exports = {
  DEFAULT_LOG_LEVEL,
  LOG_LEVELS,
  createLogger,
  formatDate,
};
