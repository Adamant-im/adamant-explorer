const supertest = require('supertest');
const chai = require('chai');
const config = require('../modules/configReader');

// The test suite runs against a live explorer instance,
// see the Tests section in the README
const BASE_URL = `http://${config.host}:${config.port}`;

const { expect } = chai;

const api = supertest(BASE_URL);

const httpRequest = {};

/**
 * Perform a GET request against the running explorer.
 * @param {string} path Request path with a query string, e.g. `/api/version`
 * @param {Function} [done] Mocha callback receiving `(err, res)`
 * @returns {Object|undefined} Supertest request when no callback is given
 */
httpRequest.get = function (path, done) {
  return abstractRequest({ verb: 'GET', path, params: null }, done);
};

/**
 * Perform a JSON request and assert a successful JSON response.
 * @param {{verb: string, path: string, params: Object|null}} options Request description
 * @param {Function} [done] Mocha callback receiving `(err, res)`
 * @returns {Object|undefined} Supertest request when no callback is given
 */
function abstractRequest(options, done) {
  const request = api[options.verb.toLowerCase()](options.path);

  request.set('Accept', 'application/json');
  request.expect('Content-Type', /json/);
  request.expect(200);

  if (options.params) {
    request.send(options.params);
  }

  if (done) {
    request.end((err, res) => {
      done(err, res);
    });
  } else {
    return request;
  }
}

module.exports = { expect, httpRequest };
