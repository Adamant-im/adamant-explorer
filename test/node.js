'use strict';

// Root object
var node = {};

// Requires
node.async = require('async');
node.popsicle = require('popsicle');
node.expect = require('chai').expect;
node.chai = require('chai');
node.chai.config.includeStack = true;
node.config = require('./config.json');
node.supertest = require('supertest');

// Node configuration
node.baseUrl = 'http://localhost:6040';
node.api = node.supertest(node.baseUrl);

function abstractRequest (options, done) {
	var request = node.api[options.verb.toLowerCase()](options.path);

	request.set('Accept', 'application/json');
	request.expect('Content-Type', /json/);
	request.expect(200);

	if (options.params) {
		request.send(options.params);
	}


	if (done) {
		request.end(function (err, res) {
			done(err, res);
		});
	} else {
		return request;
	}
}



// Get the given path
node.get = function (path, done) {
	return abstractRequest({ verb: 'GET', path: path, params: null }, done);
};

// Post to the given path
node.post = function (path, params, done) {
	return abstractRequest({ verb: 'POST', path: path, params: params }, done);
};

// Put to the given path
node.put = function (path, params, done) {
	return abstractRequest({ verb: 'PUT', path: path, params: params }, done);
};

// Exports
module.exports = node;
