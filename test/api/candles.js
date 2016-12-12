'use strict'; /*jslint mocha:true, expr:true */


var node = require('./../node.js');

describe("Candles API", function() {

  /*Define functions for use within tests*/
  function getCandles(e, d, done) {
        node.get('/api/candles/getCandles?e=' + e + '&d=' + d, done);
  }

  function getStatistics(e, done) {
        node.get('/api/candles/getStatistics?e=' + e, done);
  }

  /*Define api endpoints to test */
  describe("GET /api/candles/getCandles", function() {

        it('should be ok with poloniex', function(done) {
                getCandles('poloniex', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('candles');
                done();
                 });
         });

        it('should not be ok with bittrex', function(done) {
                getCandles('bittrex','', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                done();
                 });
        });

  });

  /* -- if all fail, check lisk for topAccounts = true */
  describe("GET /api/candles/getStatistics", function() {

        it('should be ok with poloniex', function(done) {
                getStatistics('poloniex', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                done();
                 });
         });

        it('should be not be ok bittrex', function(done) {
                getStatistics('bittrex', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                done();
                 });
         });


  });


});
