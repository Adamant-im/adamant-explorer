'use strict'; /*jslint mocha:true, expr:true */


var node = require('./../node.js');

var params = {
    blockId: "7807109686729042739",
    transactionId: "16733264093386669800",
    address: "16009998050678037905L",
    offset: 20,
    limit: 100
};

describe("Accounts API", function() {

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

    /*Define api endpoints to test */
    describe("GET /api/getTransaction", function() {

        it('should be ok with Genesis transaction', function(done) {
            getTransaction(params.transactionId, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transaction');
                node.expect(res.body.transaction).to.have.property('usd');
                node.expect(res.body.transaction).to.have.property('recipientId');
                node.expect(res.body.transaction).to.have.property('senderId');
                node.expect(res.body.transaction).to.have.property('senderPublicKey');
                node.expect(res.body.transaction).to.have.property('timestamp');
                node.expect(res.body.transaction).to.have.property('type');
                node.expect(res.body.transaction).to.have.property('blockId');
                node.expect(res.body.transaction).to.have.property('height');
                node.expect(res.body.transaction).to.have.property('id');
                node.expect(res.body.transaction).to.have.property('amount');
                node.expect(res.body.transaction).to.have.property('fee');
                node.expect(res.body.transaction).to.have.property('signature');
                node.expect(res.body.transaction).to.have.property('signatures');
                node.expect(res.body.transaction).to.have.property('confirmations');
                node.expect(res.body.transaction).to.have.property('asset');
                node.expect(res.body.transaction).to.have.property('knownSender');
                node.expect(res.body.transaction).to.have.property('knownRecipient');
                done();
            });
        });

        it('should be not be ok with no transaction', function(done) {
            getTransaction('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('should be not be ok with double quotes', function(done) {
            getTransaction('""', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });

    describe("GET /api/getUnconfirmedTransactions", function() {

        it('should be ok', function(done) {
            getUnconfirmedTransactions(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                done();
            });
        });
    });

    describe("GET /api/getLastTransactions", function() {
        it('should be ok', function(done) {
            getLastTransactions(function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                done();
            });
        });
    });

    describe("GET /api/getTransactionsByAddress", function() {
        it('should be ok with Genesis address', function(done) {
            getTransactionsByAddress(params.address, '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                done();
            });
        });

        it('should be ok with Genesis address and offset 20', function(done) {
            getTransactionsByAddress(params.address, params.offset, params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                done();
            });
        });

        it('should be not ok with invalid address', function(done) {
            getTransactionsByAddress('', '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });

    describe("GET /api/getTransactionsByBlock", function() {
        it('should be ok with Genesis block', function(done) {
            getTransactionsByBlock(params.blockId, '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                done();
            });
        });

        it('should be ok with Genesis block and offset 20', function(done) {
            getTransactionsByBlock(params.blockId, params.offset, params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('transactions');
                done();
            });
        });

        it('should be not ok with invalid block', function(done) {
            getTransactionsByBlock('', '0', params.limit, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });
});
