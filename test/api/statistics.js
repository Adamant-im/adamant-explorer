const testUtils = require('../testUtils');

describe('Statistics API', function () {
  /*Define functions for use within tests*/
  function getLastBlock(done) {
    testUtils.httpRequest.get('/api/statistics/getLastBlock', done);
  }

  function getBlocks(done) {
    testUtils.httpRequest.get('/api/statistics/getBlocks', done);
  }

  function getPeers(done) {
    testUtils.httpRequest.get('/api/statistics/getPeers', done);
  }

  function checkPeersList(id) {
    for (let i = 0; i < id.length; i++) {
      if (id[i + 1]) {
        testUtils
          .expect(id[i])
          .to.contain.all.keys(
          'ip',
          'port',
          'state',
          'os',
          'version',
          'broadhash',
          'height',
          'osBrand',
          'humanState',
        ); //'location' doesnt always get populated so we have removed it from the check
      }
    }
  }

  function checkBlock(id) {
    testUtils
      .expect(id)
      .to.contain.all.keys(
      'totalForged',
      'confirmations',
      'blockSignature',
      'generatorId',
      'generatorPublicKey',
      'payloadHash',
      'payloadLength',
      'reward',
      'id',
      'version',
      'timestamp',
      'height',
      'previousBlock',
      'numberOfTransactions',
      'totalAmount',
      'totalFee',
    );
  }

  /*Define api endpoints to test */
  describe('GET /api/statistics/getLastBlock', function () {
    it('should be ok', function (done) {
      getLastBlock((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('block');
        checkBlock(res.body.block);
        done();
      });
    }).timeout(10000);
  });

  describe('GET /api/statistics/getBlocks', function () {
    it('should be ok', function (done) {
      getBlocks((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('volume');
        testUtils.expect(res.body.volume).to.have.property('end');
        testUtils.expect(res.body.volume).to.have.property('beginning');
        testUtils.expect(res.body.volume).to.have.property('withTxs');
        testUtils.expect(res.body.volume).to.have.property('txs');
        testUtils.expect(res.body.volume).to.have.property('blocks');
        testUtils.expect(res.body.volume).to.have.property('amount');
        testUtils.expect(res.body).to.have.property('best');
        checkBlock(res.body.best);
        done();
      });
    }).timeout(60000);
  });

  describe('GET /api/statistics/getPeers', function () {
    it('should be ok', function (done) {
      getPeers((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('list');
        checkPeersList(res.body.list.connected);
        checkPeersList(res.body.list.disconnected);
        done();
      });
    });
  });
});
