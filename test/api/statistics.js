'use strict'; /*jslint mocha:true, expr:true */


var node = require('./../node.js');

describe("Statistics API", function() {

    /*Define functions for use within tests*/
    function getLastBlock(done) {
        node.get('/api/statistics/getLastBlock', done);
    }

    function getBlocks(done) {
        node.get('/api/statistics/getBlocks', done);
    }

    function getPeers(done) {
        node.get('/api/statistics/getPeers', done);
    }

    /*Define api endpoints to test */
    describe("GET /api/statistics/getLastBlock", function() {
        it('should be ok', function(done) {
            getLastBlock(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block');
                node.expect(res.body.block).to.have.property('totalForged');
                node.expect(res.body.block).to.have.property('confirmations');
                node.expect(res.body.block).to.have.property('blockSignature');
                node.expect(res.body.block).to.have.property('generatorId');
                node.expect(res.body.block).to.have.property('generatorPublicKey');
                node.expect(res.body.block).to.have.property('payloadHash');
                node.expect(res.body.block).to.have.property('payloadLength');
                node.expect(res.body.block).to.have.property('reward');
                node.expect(res.body.block).to.have.property('id');
                node.expect(res.body.block).to.have.property('version');
                node.expect(res.body.block).to.have.property('timestamp');
                node.expect(res.body.block).to.have.property('height');
                node.expect(res.body.block).to.have.property('previousBlock');
                node.expect(res.body.block).to.have.property('numberOfTransactions');
                node.expect(res.body.block).to.have.property('totalAmount');
                node.expect(res.body.block).to.have.property('totalFee');
                done();
            });
        });
    });


    describe("GET /api/statistics/getBlocks", function() {
        it('should be ok', function(done) {
            getBlocks(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('volume');
                node.expect(res.body.volume).to.have.property('end');
                node.expect(res.body.volume).to.have.property('beginning');
                node.expect(res.body.volume).to.have.property('withTxs');
                node.expect(res.body.volume).to.have.property('txs');
                node.expect(res.body.volume).to.have.property('blocks');
                node.expect(res.body.volume).to.have.property('amount');
                node.expect(res.body).to.have.property('best');
                node.expect(res.body.best).to.have.property('totalForged');
                node.expect(res.body.best).to.have.property('confirmations');
                node.expect(res.body.best).to.have.property('blockSignature');
                node.expect(res.body.best).to.have.property('generatorId');
                node.expect(res.body.best).to.have.property('generatorPublicKey');
                node.expect(res.body.best).to.have.property('payloadHash');
                node.expect(res.body.best).to.have.property('payloadLength');
                node.expect(res.body.best).to.have.property('reward');
                node.expect(res.body.best).to.have.property('id');
                node.expect(res.body.best).to.have.property('version');
                node.expect(res.body.best).to.have.property('timestamp');
                node.expect(res.body.best).to.have.property('height');
                node.expect(res.body.best).to.have.property('previousBlock');
                node.expect(res.body.best).to.have.property('numberOfTransactions');
                node.expect(res.body.best).to.have.property('totalAmount');
                node.expect(res.body.best).to.have.property('totalFee');
                done();
            });
        }).timeout(60000);
    });

    describe("GET /api/statistics/getPeers", function() {
        it('should be ok', function(done) {
            getPeers(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('list');
                node.expect(res.body.list).to.have.property('connected');
                node.expect(res.body.list).to.have.property('disconnected');
                done();
            });
        });
    });
});
