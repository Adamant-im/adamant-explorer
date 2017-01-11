'use strict'; /*jslint mocha:true, expr:true */


var node = require('./../node.js');

var params = {
    address: '16009998050678037905L',
    address_delegate: '6307319849853921018L',
    excessive_offset: '1000000'
};


describe('Accounts API', function() {

    /*Define functions for use within tests*/
    function getAccount(id, done) {
        node.get('/api/getAccount?address=' + id, done);
    }

    function getTopAccounts(id, id2, done) {
        node.get('/api/getTopAccounts?offset=' + id + '&limit=' + id2, done);
    }

    function checkAccount(id) {
        node.expect(id).to.have.all.keys(
            'success',
            'multisignatures',
            'secondPublicKey',
            'secondSignature',
            'unconfirmedSignature',
            'publicKey',
            'balance',
            'unconfirmedBalance',
            'address',
            'u_multisignatures',
            'knowledge',
            'delegate',
            'votes',
            'voters',
            'incoming_cnt',
            'outgoing_cnt'
        );
    }

    function checkTopAccounts(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                checkTopAccount(id[i]);
            }
        }
    }

    function checkTopAccount(id) {
        node.expect(id).to.have.all.keys(
            'address',
            'balance',
            'publicKey',
            'knowledge'
        );
    }

    /*Define api endpoints to test */
    describe('GET /api/getAccount', function() {

        it('using known address should be ok', function(done) {
            getAccount(params.address, function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                checkAccount(res.body);
                done();
            });
        });

        it('using invalid address should fail', function(done) {
            getAccount('L', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('using unknown address should fail', function(done) {
            getAccount('999999999L', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('using no address should fail', function(done) {
            getAccount('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });

    /* -- if all fail, check lisk for topAccounts = true */
    describe('GET /api/getTopAccounts', function() {

        it('using offset 0 and limit 100 should return 100', function(done) {
            getTopAccounts('0', '100', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(100);
                checkTopAccounts(res.body.accounts);
                done();
            });
        });

        it('using offset 0 and limit 1 should return 1', function(done) {
            getTopAccounts('0', '1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(1);
                checkTopAccounts(res.body.accounts);
                done();
            });
        });

        it('using offset 100 and limit 50 should return 50', function(done) {
            getTopAccounts('100', '50', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(50);
                checkTopAccounts(res.body.accounts);
                done();
            });
        });

        it('using offset 0 and limit 0 should return 100', function(done) {
            getTopAccounts('0', '0', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(100);
                checkTopAccounts(res.body.accounts);
                done();
            });
        });

        it('using offset 0 and limit -1 and return 100', function(done) {
            getTopAccounts('0', '-1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(100);
                checkTopAccounts(res.body.accounts);
                done();
            });
        });

        it('using offset 100000 and no limit should return 0', function(done) {
            getTopAccounts(params.excessive_offset, '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(0);
                done();
            });
        });
    });
});
