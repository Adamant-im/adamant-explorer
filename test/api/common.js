const testUtils = require('../testUtils');

const params = {
  blockId: '6438017970172540087',
  address: 'U8300472841473565177',
  tx: '9371860765879081127',
  username: 'caught',
};

describe('Common API', function () {
  /*Define functions for use within tests*/
  function getSearch(id, done) {
    testUtils.httpRequest.get('/api/search?id=' + id, done);
  }

  /*Define api endpoints to test */
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
      getSearch('caug', (err, res) => {
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
