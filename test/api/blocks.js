const testUtils = require('../testUtils');

/*expecting testnet genesis block for tests*/
const params = {
  height: 1,
  id: '6438017970172540087',
  id2: '1877375791981840387',
  generatorPublicKey: 'b80bb6459608dcdeb9a98d1f2b0111b2bf11e53ef2933e6769bb0198e3a97aae',
  totalAmount: 9800000000000000,
  totalFee: 0,
};

describe('Blocks API', function () {
  /*Define functions for use within tests*/
  function getLastBlocks(id, done) {
    testUtils.httpRequest.get('/api/getLastBlocks?n=' + id, done);
  }

  function getBlock(id, done) {
    testUtils.httpRequest.get('/api/getBlock?blockId=' + id, done);
  }

  function getBlockByHeight(id, done) {
    testUtils.httpRequest.get('/api/getBlock?height=' + id, done);
  }

  function checkPagination(id) {
    testUtils.expect(id).to.have.property('currentPage');
    testUtils.expect(id).to.have.property('more');
    testUtils.expect(id).to.have.property('previousPage');
    testUtils.expect(id).to.have.property('before');
    testUtils.expect(id).to.have.property('nextPage');
  }

  function checkLastBlocks(id) {
    for (let i = 0; i < id.length; i++) {
      if (id[i + 1]) {
        checkLastBlock(id[i]);
        checkDelegate(id[i].delegate);
      }
    }
  }

  function checkLastBlock(id) {
    testUtils
      .expect(id)
      .to.contain.all.keys(
        'delegate',
        'generator',
        'reward',
        'id',
        'timestamp',
        'height',
        'transactionsCount',
        'totalAmount',
        'totalFee',
        'totalForged',
      );
  }

  function checkDelegate(id) {
    testUtils
      .expect(id)
      .to.contain.all.keys(
        'productivity',
        'username',
        'address',
        'publicKey',
        'vote',
        'producedblocks',
        'missedblocks',
        'rate',
        'approval',
      );
  }

  function checkBlock(id) {
    testUtils
      .expect(id)
      .to.have.all.keys(
        'delegate',
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
  describe('GET /api/getLastBlocks', function () {
    it('should be ok', function (done) {
      getLastBlocks('0', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('blocks').to.be.an('array');
        testUtils.expect(res.body.blocks.length).to.equal(20);
        testUtils.expect(res.body).to.have.property('pagination');
        checkLastBlocks(res.body.blocks);
        checkPagination(res.body.pagination);
        done();
      });
    });

    it('using offset of 20 should be ok', function (done) {
      getLastBlocks('20', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('blocks').to.be.an('array');
        testUtils.expect(res.body).to.have.property('pagination');
        testUtils.expect(res.body.blocks.length).to.equal(20);
        checkLastBlocks(res.body.blocks);
        checkPagination(res.body.pagination);
        done();
      });
    });
  });

  describe('GET /api/getBlock', function () {
    it('using known blockId should be ok', function (done) {
      getBlock(params.id, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('block').to.be.a('object');
        testUtils.expect(res.body.block.delegate).to.be.null;
        checkBlock(res.body.block);
        done();
      });
    });

    it('using known blockId @ Height 2 should be ok', function (done) {
      getBlock(params.id2, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('block').to.be.a('object');
        checkBlock(res.body.block);
        checkDelegate(res.body.block.delegate);
        done();
      });
    });

    it('using unknown blockId should fail', function (done) {
      getBlock('9928719876370886655', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error').to.be.a('string');
        done();
      });
    });

    it('using no blockId should fail', function (done) {
      getBlock('', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error').to.be.a('string');
        done();
      });
    });
  });

  describe('GET /api/getBlock by height', function () {
    it('using a known height should be ok', function (done) {
      getBlockByHeight(params.height, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('block').to.be.a('object');
        testUtils.expect(res.body.block.id).to.equal(params.id);
        done();
      });
    });

    it('using invalid height should fail', function (done) {
      getBlockByHeight('-1', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error').to.be.a('string');
        done();
      });
    });

    it('using no height should fail', function (done) {
      getBlockByHeight('', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error').to.be.a('string');
        done();
      });
    });
  });
});
