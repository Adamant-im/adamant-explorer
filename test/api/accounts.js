'use strict'; /*jslint mocha:true, expr:true */


var node = require('./../node.js');

describe("Accounts API", function() {

    /*Define functions for use within tests*/
    function getAccount(id, done) {
        node.get('/api/getAccount?address=' + id, done);
    }

    function getTopAccounts(id, id2, done) {
        node.get('/api/getTopAccounts?offset=' + id + '&limit=' + id2, done);
    }

    /*Define api endpoints to test */
    describe("GET /api/getAccount", function() {

        it('should be ok with Genesis address', function(done) {
            getAccount('16009998050678037905L', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('address');
                done();
            });
        });

        it('should be not be ok with invalid address', function(done) {
            getAccount('L', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

    });

    /* -- if all fail, check lisk for topAccounts = true */
    describe("GET /api/getTopAccounts", function() {

        it('should be ok offset 0 and limit 100', function(done) {
            getTopAccounts('0', '100', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(100);
                done();
            });
        });

        it('should be ok with offset 100 and limit 50', function(done) {
            getTopAccounts('100', '50', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.accounts.length).to.equal(50);
                done();
            });
        });


    });


});
