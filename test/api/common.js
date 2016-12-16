'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

describe("Common API", function() {

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
  describe("GET /api/version", function() {

        it('should be ok', function(done) {
                getVersion( function(err, res) {
                node.expect(res.body).to.have.property('version');
                done();
                 });
         });
  });

  describe("GET /api/getPriceTicker", function() {
        it('should be ok', function(done) {
                getPriceTicker( function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('btc_usd');
                node.expect(res.body).to.have.property('lisk_btc');
                node.expect(res.body).to.have.property('lisk_usd');
                done();
                 });
         });
  });


  describe("GET /api/search", function() {

        it('using known block be ok ', function(done) {
                getSearch('7807109686729042739', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('block')
                node.expect(res.body.id).to.equal('7807109686729042739');
                done();
                 });
         });

         it('using known height be ok ', function(done) {
                 getSearch('1', function(err, res) {
                 node.expect(res.body).to.have.property('success').to.be.ok;
                 node.expect(res.body.type).to.equal('block')
                 node.expect(res.body.id).to.equal('7807109686729042739');
                 done();
                  });
          });

        it('using known address', function(done) {
                getSearch('6365926013346518016L', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body.type).to.equal('address')
                node.expect(res.body.id).to.equal('6365926013346518016L');
                done();
                 });
         });

         it('using known transaction', function(done) {
                 getSearch('16733264093386669800', function(err, res) {
                 node.expect(res.body).to.have.property('success').to.be.ok;
                 node.expect(res.body.type).to.equal('tx')
                 node.expect(res.body.id).to.equal('16733264093386669800');
                 done();
                  });
          });

          it('using known delegate', function(done) {
                  getSearch('genesis_1', function(err, res) {
                  node.expect(res.body).to.have.property('success').to.be.ok;
                  node.expect(res.body.type).to.equal('address')
                  node.expect(res.body.id).to.equal('6307319849853921018L');
                  done();
                   });
           });

        it('using no Search should fail', function (done) {
                getSearch('', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
                });
        });
  });

});
