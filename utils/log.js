const config = require('../modules/configReader');
const { createLogger } = require('./logger');

/**
 * Process-wide Explorer logger. Verbosity is controlled by `config.log_level`:
 * `none` < `error` < `warn` < `info` < `log` < `debug`.
 */
module.exports = createLogger({ level: config.log_level });
