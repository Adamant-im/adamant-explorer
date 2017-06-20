'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

/*expecting testnet genesis block for tests*/
var params = {
    height: 1,
    id: '6524861224470851795',
    id2: '8757390707158788492',
    generatorPublicKey: 'c96dec3595ff6041c3bd28b76b8cf75dce8225173d1bd00241624ee89b50f2a8',
    totalAmount: 100000000,
    totalFee: 0,
};

describe('Blocks API', function() {

    /*Define functions for use within tests*/
    function getLastBlocks(id, done) {
        node.get('/api/getLastBlocks?n=' + id, done);
    }

    function getBlockStatus(done) {
        node.get('/api/getBlockStatus', done);
    }

    function getBlock(id, done) {
        node.get('/api/getBlock?blockId=' + id, done);
    }

    function getHeight(id, done) {
        node.get('/api/getHeight?height=' + id, done);
    }

    function checkPagination(id) {
        node.expect(id).to.have.property('currentPage');
        node.expect(id).to.have.property('more');
        node.expect(id).to.have.property('previousPage');
        node.expect(id).to.have.property('before');
        node.expect(id).to.have.property('nextPage');
    }

    function checkLastBlocks(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                checkLastBlock(id[i]);
                checkDelegate(id[i].delegate);
            }
        }
    }

    function checkLastBlock(id) {
        node.expect(id).to.contain.all.keys(
            'delegate',
            'generator',
            'reward',
            'id',
            'timestamp',
            'height',
            'transactionsCount',
            'totalAmount',
            'totalFee',
            'totalForged'
        );
    }

    function checkDelegate(id) {
        node.expect(id).to.contain.all.keys(
            'productivity',
            'username',
            'address',
            'publicKey',
            'vote',
            'producedblocks',
            'missedblocks',
            'rate',
            'approval'
        );
    }

    function checkBlock(id) {
        node.expect(id).to.have.all.keys(
            'delegate',
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
    describe('GET /api/getLastBlocks', function() {

        it('should be ok', function(done) {
            getLastBlocks('0', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks').to.be.an('array');
                node.expect(res.body.blocks.length).to.equal(20);
                node.expect(res.body).to.have.property('pagination');
                checkLastBlocks(res.body.blocks);
                checkPagination(res.body.pagination);
                done();
            });
        });

        it('using offset of 20 should be ok', function(done) {
            getLastBlocks('20', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks').to.be.an('array');
                node.expect(res.body).to.have.property('pagination');
                node.expect(res.body.blocks.length).to.equal(20);
                checkLastBlocks(res.body.blocks);
                checkPagination(res.body.pagination);
                done();
            });
        });
    });

    describe('GET /api/getBlockStatus', function() {
        it('should be ok', function(done) {
            getBlockStatus(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('broadhash').to.be.a('string');
                node.expect(res.body).to.have.property('epoch').to.be.a('string');
                node.expect(res.body).to.have.property('height').to.be.a('number');
                node.expect(res.body).to.have.property('fee').to.be.a('number');
                node.expect(res.body).to.have.property('milestone').to.be.a('number');
                node.expect(res.body).to.have.property('nethash').to.be.a('string');
                node.expect(res.body).to.have.property('reward').to.be.a('number');
                node.expect(res.body).to.have.property('supply').to.be.a('number');
                done();
            });
        });
    });

    describe('GET /api/getBlock', function() {

        it('using known blockId should be ok', function(done) {
            getBlock(params.id, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block').to.be.a('object');
                node.expect(res.body.block.delegate).to.be.null;
                checkBlock(res.body.block);
                done();
            });
        });

        it('using known blockId @ Height 2 should be ok', function(done) {
            getBlock(params.id2, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block').to.be.a('object');
                checkBlock(res.body.block);
                checkDelegate(res.body.block.delegate);
                done();
            });
        });


        it('using unknown blockId should fail', function(done) {
            getBlock('9928719876370886655', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
            });
        });

        it('using no blockId should fail', function(done) {
            getBlock('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
            });
        });
    });

    describe('GET /api/getHeight', function() {

        it('using known height be ok', function(done) {
            getHeight(params.height, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block').to.be.a('object');
                node.expect(res.body.block.id).to.equal(params.id);
                done();
            });
        });

        it('using invalid height should fail', function(done) {
            getHeight('-1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
            });
        });

        it('using no height should fail', function(done) {
            getHeight('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
            });
        });
    });
});
