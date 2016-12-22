'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

describe('Orders API', function() {

    /*Define functions for use within tests*/
    function getOrders(id, done) {
        node.get('/api/orders/getOrders?e=' + id, done);
    }

    function checkOrders(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i]).to.have.all.keys(
                    'ask',
                    'bid',
                    'price',
                    'amount'
                );
            }
        }
    }

    function checkValues(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i][0]).to.be.a.number;
                node.expect(id[i][1]).to.be.a.number;
            }
        }
    }


    /*Define api endpoints to test */
    describe('GET /api/orders/getOrders', function() {

        it('should be ok with poloniex', function(done) {
            getOrders('poloniex', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('orders');
                checkOrders(res.body.orders.depth);
                checkValues(res.body.orders.asks);
                checkValues(res.body.orders.bids);
                done();
            });
        });

        it('should be not ok with unknown_exchange', function(done) {
            getOrders('unknown_exchange', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });
});
