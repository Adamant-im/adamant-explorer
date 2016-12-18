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

        it('should be ok with no inputs', function(done) {
            getCandles('', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                done();
            });
        });

        it('should be ok with poloniex', function(done) {
            getCandles('poloniex', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                node.expect(res.body).to.have.property('candles');
                done();
            });
        });

        it('should not be ok with bittrex', function(done) {
            getCandles('bittrex', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                done();
            });
        });

        it('should be ok with minute', function(done) {
            getCandles('', 'minute', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('minute');
                done();
            });
        });

        it('should be ok with hour', function(done) {
            getCandles('', 'hour', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('hour');
                done();
            });
        });

        it('should be ok with day', function(done) {
            getCandles('', 'day', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('day');
                done();
            });
        });


    });

    /* -- if all fail, check lisk for topAccounts = true */
    describe("GET /api/candles/getStatistics", function() {

        it('should be ok with no input', function(done) {
            getStatistics('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                done();
            });
        });

        it('should be ok with poloniex', function(done) {
            getStatistics('poloniex', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                done();
            });
        });

        it('should not be ok bittrex', function(done) {
            getStatistics('bittrex', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                done();
            });
        });


    });


});
