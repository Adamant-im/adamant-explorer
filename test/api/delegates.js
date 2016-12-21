'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

var params = {
    publicKey: 'a24416a05bef8874fb1c638105d892162f7d5736b7a2deda318e976fd80f64e9',
    noBlocksKey: '1111111111111111111111111111111111111111111111111111111111111111',
    invalidPublicKey: 'abdefghijklmnopqrstuvwyxz',
    delegate: 'genesis_1',
    address: '6307319849853921018L',
    offset: 20,
    excessiveOffset: 10000
}

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
        node.get('/api/delegates/getLastBlocks?publicKey=' + id1 + '&limit=' + id2, done);
    }

    function getSearch(id, done) {
        node.get('/api/getSearch?q=' + id, done);
    }

    function getNextForgers(done) {
        node.get('/api/delegates/getNextForgers', done);
    }


    /*Testing functions */
    function checkBlocks(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                checkBlock(id[i]);
            }
        }
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

    function checkDelegates(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                checkDelegate(id[i]);
            }
        }
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

    function checkPublicKeys(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i]).to.be.a.string;
            }
        }
    }

    function checkTransactions(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i]).to.have.any.keys(
                    'asset',
                    'delegate',
                    'confirmations',
                    'signatures',
                    'signature',
                    'fee',
                    'amount',
                    'id',
                    'height',
                    'blockId',
                    'type',
                    'timestamp',
                    'senderPublicKey',
                    'senderId',
                    'recipientId'
                );
                checkDelegate(id[i].delegate);
            }
        }
    }

    /*Define api endpoints to test */
    describe("GET /api/delegates/getActive", function() {

        it('should be ok', function(done) {
            getActive(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                node.expect(res.body).to.have.property('totalCount');
                checkDelegates(res.body.delegates);
                done();
            });
        });
    });

    describe("GET /api/delegates/getStandby", function() {

        it('should be ok with no offset', function(done) {
            getStandby('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                checkDelegates(res.body.delegates);
                node.expect(res.body).to.have.property('pagination');
                node.expect(res.body).to.have.property('totalCount');
                node.expect(res.body.pagination).to.have.property('currentPage');
                node.expect(res.body.pagination.currentPage).to.be.null;
                done();
            });
        });

        it('should be ok with offset of 1', function(done) {
            getStandby('1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                checkDelegates(res.body.delegates);
                node.expect(res.body).to.have.property('pagination');
                node.expect(res.body).to.have.property('totalCount');
                node.expect(res.body.pagination).to.have.property('currentPage');
                node.expect(res.body.pagination).to.have.property('more');
                node.expect(res.body.pagination).to.have.property('nextPage');
                done();
            });
        });

        it('should be ok with offset of 20', function(done) {
            getStandby(params.offset, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                checkDelegates(res.body.delegates);
                node.expect(res.body).to.have.property('pagination');
                node.expect(res.body).to.have.property('totalCount');
                node.expect(res.body.pagination).to.have.property('currentPage');
                node.expect(res.body.pagination).to.have.property('before');
                node.expect(res.body.pagination).to.have.property('previousPage');
                node.expect(res.body.pagination).to.have.property('more');
                node.expect(res.body.pagination).to.have.property('nextPage');
                done();
            });
        });

        it('should be ok with excessive offset', function(done) {
            getStandby(params.excessiveOffset, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                checkDelegates(res.body.delegates);
                node.expect(res.body).to.have.property('pagination');
                node.expect(res.body).to.have.property('totalCount');
                node.expect(res.body.pagination).to.have.property('currentPage');
                node.expect(res.body.pagination).to.have.property('before');
                node.expect(res.body.pagination).to.have.property('previousPage');
                done();
            });
        });
    })

    describe("GET /api/delegates/getLatestRegistrations", function() {

        it('should be ok', function(done) {
            getLatestRegistrations(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                checkTransactions(res.body.transactions);
                done();
            });
        });
    })

    describe("GET /api/delegates/getLastBlock", function() {

        it('should be ok', function(done) {
            getLastBlock(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block');
                checkBlock(res.body.block);
                checkDelegate(res.body.block.delegate);
                done();
            });
        });
    });

    describe("GET /api/delegates/getLastBlocks", function() {

        it('should be ok', function(done) {
            getLastBlocks(params.publickKey, '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks');
                checkBlocks(res.body.blocks);
                done();
            });
        });

        it('should be ok with limit 10', function(done) {
            getLastBlocks(params.publickKey, '10', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks');
                checkBlocks(res.body.blocks);
                done();
            });
        });

        it('should be ok and return 20 with limit > 20', function(done) {
            getLastBlocks(params.publickKey, '100', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks');
                checkBlocks(res.body.blocks);
                done();
            });
        });

        it('should be ok with Public Key without blocks', function(done) {
            getLastBlocks(params.noBlocksKey, '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks');
                done();
            });
        });

        it.skip('should be not ok with invalidPublicKey', function(done) {
            getLastBlocks(params.invalidPublicKey, '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('blocks');
                done();
            });
        });

        it('should be not ok with no params', function(done) {
            getLastBlocks('', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

    });



    describe("GET /api/getSearch", function() {

        it('should be ok', function(done) {
            getSearch(params.delegate, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.address).to.have.equal(params.address);
                done();
            });
        });

        it('should be not ok with no params', function(done) {
            getSearch('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('should autocomplete with partial name', function(done) {
            getSearch('gene', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.address).to.have.equal(params.address);
                done();
            });
        });
    });

    describe("GET /api/getNextForgers", function() {

        it('should be ok', function(done) {
            getNextForgers(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('delegates');
                checkPublicKeys(res.body.delegates);
                done();
            });
        });
    });

});
