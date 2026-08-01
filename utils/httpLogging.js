/**
 * Select the application log level for an HTTP response.
 *
 * Successful and redirect responses are request-level diagnostics, client
 * errors are recoverable warnings, and server errors require attention.
 * @param {number|string} statusCode HTTP response status
 * @returns {'debug'|'warn'|'error'} Logger method name
 */
function getHttpLogLevel(statusCode) {
  const status = Number(statusCode);

  if (status >= 500) {
    return 'error';
  }

  if (status >= 400) {
    return 'warn';
  }

  return 'debug';
}

/**
 * Create a Morgan formatter that writes directly to the Explorer logger.
 *
 * Only the route path is logged: query strings may contain user-supplied
 * identifiers and are deliberately excluded from operational logs.
 * @param {{debug: Function, warn: Function, error: Function}} logger Logger instance
 * @returns {Function} Morgan format callback
 */
function createHttpLogFormatter(logger) {
  return (tokens, req, res) => {
    const method = tokens.method(req, res) ?? req.method ?? 'UNKNOWN';
    const path = req.path ?? req.originalUrl?.split('?')[0] ?? '/';
    const status = tokens.status(req, res) ?? res.statusCode;
    const responseTime = tokens['response-time'](req, res) ?? 'unknown';
    const responseBytes = tokens.res(req, res, 'content-length') ?? 'unknown';
    const level = getHttpLogLevel(status);

    logger[level](
      `HTTP: ${method} ${path} -> ${status} in ${responseTime} ms; responseBytes=${responseBytes}`,
    );

    // Morgan treats a null format result as already handled and skips its stream.
    return null;
  };
}

module.exports = {
  createHttpLogFormatter,
  getHttpLogLevel,
};
