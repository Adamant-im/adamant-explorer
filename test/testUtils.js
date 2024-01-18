const supertest = require('supertest');
const chai = require('chai');
const config = require('../modules/configReader');

const BASE_URL = `http://${config.host}:${config.port}`;

const { expect } = chai;

const api = supertest(BASE_URL);

const httpRequest = {};

httpRequest.get = function (path, done) {
  return abstractRequest({verb: 'GET', path: path, params: null}, done);
};

httpRequest.post = function (path, params, done) {
  return abstractRequest({verb: 'POST', path: path, params: params}, done);
};

httpRequest.put = function (path, params, done) {
  return abstractRequest({verb: 'PUT', path: path, params: params}, done);
};

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
