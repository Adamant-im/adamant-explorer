const testUtils = require('../testUtils');

const params = {
  blockId: '13096746075322409574',
  address: 'U9466395914658764774',
  tx: '9557655214057042533',
  username: 'adm_official_pool',
};

describe('Common API', function () {
  /*Define functions for use within tests*/
  function getVersion(done) {
    testUtils.httpRequest.get('/api/version', done);
  }

  function getPriceTicker(done) {
    testUtils.httpRequest.get('/api/getPriceTicker', done);
  }

  function getSearch(id, done) {
    testUtils.httpRequest.get('/api/search?id=' + id, done);
  }

  /*Define api endpoints to test */
  describe('GET /api/version', function () {
    it('should be ok', function (done) {
      getVersion((err, res) => {
        testUtils.expect(res.body).to.have.property('version');
        done();
      });
    });
  });

  // Exchange functions are disabled. Expect it to fail
  describe.skip('GET /api/getPriceTicker', function () {
    it('should be ok', function (done) {
      getPriceTicker((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.BTC').to.be.a.number;
        testUtils
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.EUR').to.be.a.number;
        testUtils
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.USD').to.be.a.number;
        testUtils
          .expect(res.body)
          .to.have.deep.property('tickers.LSK.CNY').to.be.a.number;
        testUtils
          .expect(res.body)
          .to.have.deep.property('tickers.BTC.USD').to.be.a.number;
        testUtils
          .expect(res.body)
          .to.have.deep.property('tickers.BTC.EUR').to.be.a.number;
        done();
      });
    });
  });

  describe('GET /api/search', function () {
    it('using known block should be ok', function (done) {
      getSearch(params.blockId, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.type).to.equal('block');
        testUtils.expect(res.body.id).to.equal(params.blockId);
        done();
      });
    });

    it('using known height should be ok', function (done) {
      getSearch('1', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.type).to.equal('block');
        testUtils.expect(res.body.id).to.equal(params.blockId);
        done();
      });
    });

    it('using known address should be ok', function (done) {
      getSearch(params.address, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.type).to.equal('address');
        testUtils.expect(res.body.id).to.equal(params.address);
        done();
      });
    });

    it('using known transaction should be ok', function (done) {
      getSearch(params.tx, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.type).to.equal('tx');
        testUtils.expect(res.body.id).to.equal(params.tx);
        done();
      });
    });

    it('using known delegate should be ok', function (done) {
      getSearch(params.username, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.type).to.equal('address');
        testUtils.expect(res.body.id).to.equal(params.address);
        done();
      });
    });

    it('using partial known delegate should be ok', function (done) {
      getSearch('adm_official', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.type).to.equal('address');
        testUtils.expect(res.body.id).to.equal(params.address);
        done();
      });
    });

    it('using no input should fail', function (done) {
      getSearch('', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error').to.be.a('string');
        done();
      });
    });
  });
});
