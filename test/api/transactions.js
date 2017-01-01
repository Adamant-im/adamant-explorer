'use strict'; /*jslint mocha:true, expr:true */


var node = require('./../node.js');

var params = {
    blockId: '7807109686729042739',
    transactionId: '16733264093386669800',
    address: '16009998050678037905L',
    offset: 20,
    limit: 100
};

describe('Transactions API', function() {

    /*Define functions for use within tests*/
    function getTransaction(id, done) {
        node.get('/api/getTransaction?transactionId=' + id, done);
    }

    function getUnconfirmedTransactions(done) {
        node.get('/api/getUnconfirmedTransactions', done);
    }

    function getLastTransactions(done) {
        node.get('/api/getLastTransactions', done);
    }

    function getTransactionsByAddress(id, id2, id3, done) {
        node.get('/api/getTransactionsByAddress?address=' + id + '&offset=' + id2 + '&limit=' + id3, done);
    }

    function getTransactionsByBlock(id, id2, id3, done) {
        node.get('/api/getTransactionsByBlock?blockId=' + id + '&offset=' + id2 + '&limit=' + id3, done);
    }

    function checkTransactionsBody(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i]).to.contain.all.keys(
                    'usd',
                    'recipientId',
                    'senderId',
                    'senderPublicKey',
                    'senderDelegate',
                    'knownSender',
                    'timestamp',
                    'type',
                    'blockId',
                    'height',
                    'id',
                    'amount',
                    'fee',
                    'signature',
                    'signatures',
                    'confirmations',
                    'asset',
                    'recipientDelegate',
                    'knownRecipient',
                    'recipientPublicKey'
                );
            }
        }
    }

    /*Define api endpoints to test */
    describe('GET /api/getTransaction', function() {

        it('should be ok with Genesis transaction', function(done) {
            getTransaction(params.transactionId, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transaction');
                node.expect(res.body.transaction).to.contain.all.keys(
                    'usd',
                    'recipientId',
                    'senderId',
                    'senderPublicKey',
                    'knownSender',
                    'timestamp',
                    'type',
                    'blockId',
                    'height',
                    'id',
                    'amount',
                    'fee',
                    'signature',
                    'signatures',
                    'confirmations',
                    'asset',
                    'knownRecipient',
                    'recipientPublicKey'
                );
                done();
            });
        });

        it('should be not ok with no transaction', function(done) {
            getTransaction('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });

    /* We are skipping this temporarily, theres a call back error that needs to be fixed */
    describe('GET /api/getUnconfirmedTransactions', function() {

        it.skip('should be ok', function(done) {
            getUnconfirmedTransactions(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                done();
            });
        });
    });

    describe('GET /api/getLastTransactions', function() {
        it('should be ok', function(done) {
            getLastTransactions(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions').that.is.an('array');
                checkTransactionsBody(res.body.transactions);
                done();
            });
        }).timeout(10000);
    });

    describe('GET /api/getTransactionsByAddress', function() {
        it('using known address should be ok', function(done) {
            getTransactionsByAddress(params.address, '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions').that.is.an('array');
                checkTransactionsBody(res.body.transactions);
                done();
            });
        });

        it('using known address and offset of 20 should be ok', function(done) {
            getTransactionsByAddress(params.address, params.offset, params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions').that.is.an('array');
                checkTransactionsBody(res.body.transactions);
                done();
            });
        });

        it('using invalid address should fail', function(done) {
            getTransactionsByAddress('', '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });

    describe('GET /api/getTransactionsByBlock', function() {
        it('using known block should be ok', function(done) {
            getTransactionsByBlock(params.blockId, '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions').that.is.an('array');
                checkTransactionsBody(res.body.transactions);
                done();
            });
        }).timeout(5000);

        it('using known block and offset of 20 should be ok', function(done) {
            getTransactionsByBlock(params.blockId, params.offset, params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                checkTransactionsBody(res.body.transactions);
                done();
            });
        }).timeout(5000);

        it('using invalid block should fail', function(done) {
            getTransactionsByBlock('', '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });
});
