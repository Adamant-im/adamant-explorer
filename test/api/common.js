'use strict';

const node = require('./../node.js');

const params = {
  blockId: '7621909812231456129',
  address: 'U1946714209456091685',
  tx: '9557655214057042533',
  username: 'buterin_pool',
};

describe('Common API', function () {
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
  describe('GET /api/version', function () {
    it('should be ok', function (done) {
      getVersion((err, res) => {
        node.expect(res.body).to.have.property('version');
        done();
      });
    });
  });

  // Exchange rates are disabled. Expect it to fail
  describe('GET /api/getPriceTicker', function () {
    it('should be ok', function (done) {
      getPriceTicker((err, res) => {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.BTC').to.be.a.number;
        node
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.EUR').to.be.a.number;
        node
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.USD').to.be.a.number;
        node
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.CNY').to.be.a.number;
        node
          .expect(res.body)
          .to.have.deep.property('tickers.BTC.USD').to.be.a.number;
        node
          .expect(res.body)
          .to.have.deep.property('tickers.BTC.EUR').to.be.a.number;
        done();
      });
    });
  });

  describe('GET /api/search', function () {
    it('using known block should be ok', function (done) {
      getSearch(params.blockId, (err, res) => {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node.expect(res.body.type).to.equal('block');
        node.expect(res.body.id).to.equal(params.blockId);
        done();
      });
    });

    it('using known height should be ok', function (done) {
      getSearch('1', (err, res) => {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node.expect(res.body.type).to.equal('block');
        node.expect(res.body.id).to.equal(params.blockId);
        done();
      });
    });

    it('using known address should be ok', function (done) {
      getSearch(params.address, (err, res) => {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node.expect(res.body.type).to.equal('address');
        node.expect(res.body.id).to.equal(params.address);
        done();
      });
    });

    it('using known transaction should be ok', function (done) {
      getSearch(params.tx, (err, res) => {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node.expect(res.body.type).to.equal('tx');
        node.expect(res.body.id).to.equal(params.tx);
        done();
      });
    });

    it('using known delegate should be ok', function (done) {
      getSearch(params.username, (err, res) => {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node.expect(res.body.type).to.equal('address');
        node.expect(res.body.id).to.equal(params.address);
        done();
      });
    });

    it('using partial known delegate should be ok', function (done) {
      getSearch('gene', (err, res) => {
        node.expect(res.body).to.have.property('success').to.be.ok;
        node.expect(res.body.type).to.equal('address');
        node.expect(res.body.id).to.equal(params.address);
        done();
      });
    });

    it('using no input should fail', function (done) {
      getSearch('', (err, res) => {
        node.expect(res.body).to.have.property('success').to.be.not.ok;
        node.expect(res.body).to.have.property('error').to.be.a('string');
        done();
      });
    });
  });
});
