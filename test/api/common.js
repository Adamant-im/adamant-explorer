'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

var params = {
    blockId: '6524861224470851795',
    address: '8273455169423958419L',
    tx: '1465651642158264047',
    username: 'genesis_1'
};

describe('Common API', function() {

    /*Define functions for use within tests*/
    function getVersion(done) {
        node.get('/api/version', done);
    }

    function getPriceTicker(done) {
        node.get('/api/getPriceTicker', done);
    }

    function getSearch(id, done) {
        node.get('/api/search?id=' + id, done);
    }

    /*Define api endpoints to test */
    describe('GET /api/version', function() {
        it('should be ok', function(done) {
            getVersion(function(err, res) {
                node.expect(res.body).to.have.property('version');
                done();
            });
        });
    });

    describe('GET /api/getPriceTicker', function() {
        it('should be ok', function(done) {
            getPriceTicker(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.deep.property('tickers.LSK.BTC').to.be.a.number;
                node.expect(res.body).to.have.deep.property('tickers.LSK.EUR').to.be.a.number;
                node.expect(res.body).to.have.deep.property('tickers.LSK.USD').to.be.a.number;
                node.expect(res.body).to.have.deep.property('tickers.LSK.CNY').to.be.a.number;
                node.expect(res.body).to.have.deep.property('tickers.BTC.USD').to.be.a.number;
                node.expect(res.body).to.have.deep.property('tickers.BTC.EUR').to.be.a.number;
                done();
            });
        });
    });


    describe('GET /api/search', function() {

        it('using known block should be ok', function(done) {
            getSearch(params.blockId, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('block');
                node.expect(res.body.id).to.equal(params.blockId);
                done();
            });
        });

        it('using known height should be ok', function(done) {
            getSearch('1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('block');
                node.expect(res.body.id).to.equal(params.blockId);
                done();
            });
        });

        it('using known address should be ok', function(done) {
            getSearch(params.address, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('address');
                node.expect(res.body.id).to.equal(params.address);
                done();
            });
        });

        it('using known transaction should be ok', function(done) {
            getSearch(params.tx, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('tx');
                node.expect(res.body.id).to.equal(params.tx);
                done();
            });
        });

        it('using known delegate should be ok', function(done) {
            getSearch(params.username, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('address');
                node.expect(res.body.id).to.equal(params.address);
                done();
            });
        });

        it('using partial known delegate should be ok', function(done) {
            getSearch('gene', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('address');
                node.expect(res.body.id).to.equal(params.address);
                done();
            });
        });

        it('using no input should fail', function(done) {
            getSearch('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
            });
        });
    });
});
