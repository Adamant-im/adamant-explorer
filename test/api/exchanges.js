'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

describe('Exchanges API (Market Watcher)', function () {

    /*Define functions for use within tests*/
    function getExchanges (done) {
        node.get('/api/exchanges', done);
    }

    function getCandles (e, d, done) {
        node.get('/api/exchanges/getCandles?e=' + e + '&d=' + d, done);
    }

    function getStatistics (e, done) {
        node.get('/api/exchanges/getStatistics?e=' + e, done);
    }

    function checkCandles (id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i]).to.have.all.keys(
                    'timestamp',
                    'date',
                    'high',
                    'low',
                    'open',
                    'close',
                    'liskVolume',
                    'btcVolume',
                    'firstTrade',
                    'lastTrade',
                    'nextStart',
                    'numTrades'
                );
            }
        }
    }

    function getOrders (id, done) {
        node.get('/api/exchanges/getOrders?e=' + id, done);
    }

    function checkOrders (id) {
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

    function checkValues (id) {
        for (var i = 0; i < id.length; i++) {
            if (id[i + 1]) {
                node.expect(id[i][0]).to.be.a.number;
                node.expect(id[i][1]).to.be.a.number;
            }
        }
    }

    /*Define api endpoints to test */
    describe('GET /api/exchanges', function () {
        it('should be ok', function (done) {
            getExchanges(function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('enabled').to.be.ok;
                node.expect(res.body).to.have.deep.property('exchanges.poloniex').to.be.ok;
                node.expect(res.body).to.have.deep.property('exchanges.bittrex').to.be.ok;
                done();
            });
        });
    });

    describe('GET /api/exchanges/getCandles', function () {

        it('using no inputs should fail', function (done) {
            getCandles('', '', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('using bittrex should be ok', function (done) {
            getCandles('bittrex', '', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('bittrex');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('using poloniex should be ok', function (done) {
            getCandles('poloniex', '', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('using unknown_exchange should not be ok', function (done) {
            getCandles('unknown_exchange', '', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('using minute for bittrex should be ok and return timeframe minute', function (done) {
            getCandles('bittrex', 'minute', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('minute');
                node.expect(res.body).to.have.property('exchange').to.be.equal('bittrex');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('using hour for bittrex should be ok and return timeframe hour', function (done) {
            getCandles('bittrex', 'hour', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('hour');
                node.expect(res.body).to.have.property('exchange').to.be.equal('bittrex');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('using day for bittrex should be ok and return timeframe day', function (done) {
            getCandles('bittrex', 'day', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('day');
                node.expect(res.body).to.have.property('exchange').to.be.equal('bittrex');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('using minute for poloniex should be ok and return timeframe minute', function (done) {
            getCandles('poloniex', 'minute', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('minute');
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('using hour for poloniex should be ok and return timeframe hour', function (done) {
            getCandles('poloniex', 'hour', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('hour');
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                checkCandles(res.body.candles);
                done();
            });
        });

        it('using day for poloniex should be ok and return timeframe day', function (done) {
            getCandles('poloniex', 'day', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('timeframe').to.be.equal('day');
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                checkCandles(res.body.candles);
                done();
            });
        });
    });

    describe('GET /api/exchanges/getOrders', function () {

        it('using bittrex should be ok', function (done) {
            getOrders('bittrex', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('orders');
                checkOrders(res.body.orders.depth);
                checkValues(res.body.orders.asks);
                checkValues(res.body.orders.bids);
                done();
            });
        });

        it('using poloniex should be ok', function (done) {
            getOrders('poloniex', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('orders');
                checkOrders(res.body.orders.depth);
                checkValues(res.body.orders.asks);
                checkValues(res.body.orders.bids);
                done();
            });
        });

        it('using no input should fail', function (done) {
            getOrders('', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('using unknown_exchange should fail', function (done) {
            getOrders('unknown_exchange', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });

    describe('GET /api/exchanges/getStatistics', function () {

        it('using no input should fail', function (done) {
            getStatistics('', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });

        it('using bittrex should be ok', function (done) {
            getStatistics('bittrex', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('bittrex');
                done();
            });
        });

        it('using poloniex should be ok', function (done) {
            getStatistics('poloniex', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('exchange').to.be.equal('poloniex');
                done();
            });
        });

        it('using unknown_exchange should not be ok', function (done) {
            getStatistics('unknown_exchange', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error');
                done();
            });
        });
    });
});
