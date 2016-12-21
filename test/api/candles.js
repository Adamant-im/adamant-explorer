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

    function checkCandles(id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i]).to.have.all.keys(
                    'timestamp',
                    'date',
                    'high',
                    'low',
                    'open',
                    "close",
                    'liskVolume',
                    'btcVolume',
                    'firstTrade',
                    'lastTrade',
                    'nextStart',
                    'numTrades'
                )
            }
        }
    }

    /*Define api endpoints to test */
    describe("GET /api/candles/getCandles", function() {

        it('should be ok with no inputs', function(done) {
            getCandles('', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('should be ok with poloniex', function(done) {
            getCandles('poloniex', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                checkCandles(res.body.candles);;
                done();
            });
        });

        it('should not be ok with unknown_exchange', function(done) {
            getCandles('unknown_exchange', '', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('should be ok with minute', function(done) {
            getCandles('', 'minute', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('minute');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('should be ok with hour', function(done) {
            getCandles('', 'hour', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('hour');
                node.expect(res.body).to.have.property('exchange');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('should be ok with day', function(done) {
            getCandles('', 'day', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('day');
                node.expect(res.body).to.have.property('exchange');
                checkCandles(res.body.candles);
                done();
            });
        });
    });

    /* -- if all fail, check lisk for topAccounts = true */
    describe("GET /api/candles/getStatistics", function() {

        it('should be ok with no input', function(done) {
            getStatistics('', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange');
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

        it('should not be ok with unknown_exchange', function(done) {
            getStatistics('unknown_exchange', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });
});
