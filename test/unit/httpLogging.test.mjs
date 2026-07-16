import { createRequire } from 'node:module';
import { expect } from 'chai';

const require = createRequire(import.meta.url);
const { createHttpLogFormatter, getHttpLogLevel } = require('../../utils/httpLogging.js');

describe('HTTP request logging', function () {
  it('maps routine, client-error, and server-error responses to distinct levels', function () {
    expect(getHttpLogLevel(200)).to.equal('debug');
    expect(getHttpLogLevel(302)).to.equal('debug');
    expect(getHttpLogLevel(404)).to.equal('warn');
    expect(getHttpLogLevel(503)).to.equal('error');
  });

  it('logs useful response details without exposing the query string', function () {
    const calls = [];
    const logger = Object.fromEntries(
      ['debug', 'warn', 'error'].map((level) => [
        level,
        (message) => calls.push({ level, message }),
      ]),
    );
    const formatter = createHttpLogFormatter(logger);
    const tokens = {
      method: () => 'GET',
      status: () => '200',
      'response-time': () => '12.345',
      res: () => '418',
    };
    const result = formatter(
      tokens,
      {
        method: 'GET',
        path: '/api/getBlock',
        originalUrl: '/api/getBlock?blockId=sensitive-user-input',
      },
      { statusCode: 200 },
    );

    expect(result).to.equal(null);
    expect(calls).to.deep.equal([
      {
        level: 'debug',
        message: 'HTTP: GET /api/getBlock -> 200 in 12.345 ms; responseBytes=418',
      },
    ]);
    expect(calls[0].message).not.to.include('sensitive-user-input');
  });
});
