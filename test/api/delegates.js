'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

describe("Delegates API", function() {

    /*Define functions for use within tests*/
    function getActive(done) {
        node.get('/api/delegates/getActive', done);
    }

    function getStandby(id, done) {
        node.get('/api/delegates/getStandby?n=' + id, done);
    }

    function getLatestRegistrations(done) {
        node.get('/api/delegates/getLatestRegistrations', done);
    }

    function getLastBlock(done) {
        node.get('/api/delegates/getLastBlock', done);
    }

    function getLastBlocks(id1, id2, done) {
        node.get('/api/delegates/getLastBlocks?publicKey=' + id1 + '?limit=' + id2, done);
    }

    function getSearch(id, done) {
        node.get('/api/getSearch?q=' + id, done);
    }

    function getNextForgers(done) {
        node.get('/api/delegates/getNextForgers', done);
    }
    /*Define api endpoints to test */
    describe("GET /api/delegates/getActive", function() {

        it('should be ok', function(done) {
            getActive(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                done();
            });
        });
    });

    describe("GET /api/delegates/getStandby", function() {

        it('should be ok', function(done) {
            getStandby('20', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                node.expect(res.body).to.have.property('pagination');
                done();
            });
        });
    })

    describe("GET /api/delegates/getLatestRegistrations", function() {

        it('should be ok', function(done) {
            getLatestRegistrations(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                done();
            });
        });
    })

    describe("GET /api/delegates/getLastBlock", function() {

        it('should be ok', function(done) {
            getLastBlock(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block');
                done();
            });
        });
    });

    describe("GET /api/delegates/getLastBlocks", function() {

        it('should be ok', function(done) {
            getLastBlocks('a24416a05bef8874fb1c638105d892162f7d5736b7a2deda318e976fd80f64e9', '10', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks');
                done();
            });
        });
    });

    describe("GET /api/getSearch", function() {

        it('should be ok', function(done) {
            getSearch('genesis_1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.address).to.have.equal('6307319849853921018L');
                done();
            });
        });
    });

    describe("GET /api/getNextForgers", function() {

        it('should be ok', function(done) {
            getNextForgers(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                done();
            });
        });
    });

});
