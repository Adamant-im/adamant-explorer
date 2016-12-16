'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

describe("Orders API", function() {

  /*Define functions for use within tests*/
  function getOrders(id, done) {
        node.get('/api/orders/getOrders?e=' + id, done);
  }

  /*Define api endpoints to test */
  describe("GET /api/orders/getOrders", function() {

    it('should be ok with poloniex', function(done) {
        getOrders("poloniex", function(err, res) {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node.expect(res.body).to.have.property('orders');
        done();
        });
     });

    it('should be not ok with bittrex', function(done) {
        getOrders('bittrex', function(err, res) {
        node.expect(res.body).to.have.property('success').to.be.not.ok;
        done();
        });
    });
  });

});
