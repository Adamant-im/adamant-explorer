'use strict'; /*jslint mocha:true, expr:true */


var node = require('./../node.js');

describe('Statistics API', function() {

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

    function checkPeersList(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i]).to.contain.all.keys(
                    'ip',
                    'port',
                    'state',
                    'os',
                    'version',
                    'broadhash',
                    'height',
                    'osBrand',
                    'humanState'
                ); //'location' doesnt always get populated so we have removed it from the check
            }
        }
    }

    function checkBlock(id) {
        node.expect(id).to.contain.all.keys(
            'totalForged',
            'confirmations',
            'blockSignature',
            'generatorId',
            'generatorPublicKey',
            'payloadHash',
            'payloadLength',
            'reward',
            'id',
            'version',
            'timestamp',
            'height',
            'previousBlock',
            'numberOfTransactions',
            'totalAmount',
            'totalFee'
        );
    }

    /*Define api endpoints to test */
    describe('GET /api/statistics/getLastBlock', function() {
        it('should be ok', function(done) {
            getLastBlock(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block');
                checkBlock(res.body.block);
                done();
            });
        });
    });

    describe('GET /api/statistics/getBlocks', function() {
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
                checkBlock(res.body.best);
                done();
            });
        }).timeout(60000);
    });



    describe('GET /api/statistics/getPeers', function() {
        it('should be ok', function(done) {
            getPeers(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('list');
                checkPeersList(res.body.list.connected);
                checkPeersList(res.body.list.disconnected);
                done();
            });
        });
    });
});
