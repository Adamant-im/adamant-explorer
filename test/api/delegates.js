const testUtils = require('../testUtils');

const params = {
  publicKey: '054ac27e10b11dc4b894837558bd964a2df6cb90fcebe0b0f6e15909a7128310',
  noBlocksKey:
    '1111111111111111111111111111111111111111111111111111111111111111',
  invalidPublicKey: 'abcdefghijklmnopqrstuvwyxz',
  delegate: 'adm_official_pool',
  address: 'U9466395914658764774',
  offset: 20,
  excessiveOffset: 10000,
};

describe('Delegates API', function () {
  /*Define functions for use within tests*/
  function getActive(done) {
    testUtils.httpRequest.get('/api/delegates/getActive', done);
  }

  function getStandby(id, done) {
    testUtils.httpRequest.get(id ? '/api/delegates/getStandby?n=' + id : '/api/delegates/getStandby', done);
  }

  function getLatestRegistrations(done) {
    testUtils.httpRequest.get('/api/delegates/getLatestRegistrations', done);
  }

  function getLastBlock(done) {
    testUtils.httpRequest.get('/api/delegates/getLastBlock', done);
  }

  function getLastBlocks(id1, id2, done) {
    testUtils.httpRequest.get(
      '/api/delegates/getLastBlocks?publicKey=' + id1 + '&limit=' + id2,
      done,
    );
  }

  function getSearch(id, done) {
    testUtils.httpRequest.get('/api/getSearch?q=' + id, done);
  }

  function getNextForgers(done) {
    testUtils.httpRequest.get('/api/delegates/getNextForgers', done);
  }

  /*Testing functions */
  function checkBlocks(id) {
    for (let i = 0; i < id.length; i++) {
      if (id[i + 1]) {
        checkBlock(id[i]);
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

  function checkDelegates(id) {
    for (let i = 0; i < id.length; i++) {
      if (id[i + 1]) {
        checkDelegate(id[i]);
      }
    }
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

  function checkPublicKeys(id) {
    for (let i = 0; i < id.length; i++) {
      if (id[i + 1]) {
        testUtils.expect(id[i]).to.be.a.string;
      }
    }
  }

  function checkTransactions(id) {
    for (let i = 0; i < id.length; i++) {
      if (id[i + 1]) {
        testUtils
          .expect(id[i])
          .to.contain.all.keys(
            'asset',
            'delegate',
            'confirmations',
            'signatures',
            'signature',
            'fee',
            'amount',
            'id',
            'height',
            'blockId',
            'type',
            'timestamp',
            'senderPublicKey',
            'senderId',
            'recipientId',
          );
        checkDelegate(id[i].delegate);
      }
    }
  }

  /*Define api endpoints to test */
  describe('GET /api/delegates/getActive', function () {
    it('should be ok', function (done) {
      getActive((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('delegates');
        testUtils.expect(res.body).to.have.property('totalCount');
        checkDelegates(res.body.delegates);
        done();
      });
    });
  });

  describe('GET /api/delegates/getStandby', function () {
    it('using no offset should be ok', function (done) {
      getStandby('', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('delegates');
        checkDelegates(res.body.delegates);
        testUtils.expect(res.body).to.have.property('pagination');
        testUtils.expect(res.body).to.have.property('totalCount');
        testUtils.expect(res.body.pagination).to.have.property('currentPage');
        testUtils.expect(res.body.pagination.currentPage).to.be.null;
        done();
      });
    });

    it('using offset of 1 should be ok', function (done) {
      getStandby('1', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('delegates');
        checkDelegates(res.body.delegates);
        testUtils.expect(res.body).to.have.property('pagination');
        testUtils.expect(res.body).to.have.property('totalCount');
        testUtils.expect(res.body.pagination).to.have.property('currentPage');
        testUtils.expect(res.body.pagination).to.have.property('more');
        testUtils.expect(res.body.pagination).to.have.property('nextPage');
        done();
      });
    });

    it('using offset of 20 should be ok', function (done) {
      getStandby(params.offset, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('delegates');
        checkDelegates(res.body.delegates);
        testUtils.expect(res.body).to.have.property('pagination');
        testUtils.expect(res.body).to.have.property('totalCount');
        testUtils.expect(res.body.pagination).to.have.property('currentPage');
        testUtils.expect(res.body.pagination).to.have.property('before');
        testUtils.expect(res.body.pagination).to.have.property('previousPage');
        testUtils.expect(res.body.pagination).to.have.property('more');
        testUtils.expect(res.body.pagination).to.have.property('nextPage');
        done();
      });
    });

    it('using offset of 100000 should be ok', function (done) {
      getStandby(params.excessiveOffset, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('delegates');
        checkDelegates(res.body.delegates);
        testUtils.expect(res.body).to.have.property('pagination');
        testUtils.expect(res.body).to.have.property('totalCount');
        testUtils.expect(res.body.pagination).to.have.property('currentPage');
        testUtils.expect(res.body.pagination).to.have.property('before');
        testUtils.expect(res.body.pagination).to.have.property('previousPage');
        done();
      });
    });
  });

  describe('GET /api/delegates/getLatestRegistrations', function () {
    it('should be ok', function (done) {
      getLatestRegistrations((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('transactions');
        checkTransactions(res.body.transactions);
        done();
      });
    });
  });

  describe('GET /api/delegates/getLastBlock', function () {
    it('should be ok', function (done) {
      getLastBlock((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('block');
        checkBlock(res.body.block);
        checkDelegate(res.body.block.delegate);
        done();
      });
    });
  });

  describe('GET /api/delegates/getLastBlocks', function () {
    it('should be ok', function (done) {
      getLastBlocks(params.publicKey, '', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('blocks');
        checkBlocks(res.body.blocks);
        done();
      });
    }).timeout(20000);

    it('using limit 10 should be ok', function (done) {
      getLastBlocks(params.publicKey, '10', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('blocks').to.be.an('array');
        testUtils.expect(res.body).to.have.property('blocks');
        testUtils.expect(res.body.blocks.length).to.equal(10);
        checkBlocks(res.body.blocks);
        done();
      });
    }).timeout(20000);

    it('using limit 100 should be ok and return 20', function (done) {
      getLastBlocks(params.publicKey, '100', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('blocks');
        testUtils.expect(res.body.blocks.length).to.equal(20);
        checkBlocks(res.body.blocks);
        done();
      });
    }).timeout(20000);

    it('using publicKey with no blocks should be ok', function (done) {
      getLastBlocks(params.noBlocksKey, '', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('blocks');
        done();
      });
    });

    it.skip('using invalid publickey should fail', function (done) {
      getLastBlocks(params.invalidPublicKey, '', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('blocks');
        done();
      });
    });

    it('using no parameters should fail', function (done) {
      getLastBlocks('', '', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error');
        done();
      });
    });
  });

  describe('GET /api/getSearch', function () {
    it('should be ok', function (done) {
      getSearch(params.delegate, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.address).to.have.equal(params.address);
        done();
      });
    });

    it('using no parameters should fail', function (done) {
      getSearch('', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error');
        done();
      });
    });

    it('using partial name should autocomplete', function (done) {
      getSearch('adm_official', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.address).to.have.equal(params.address);
        done();
      });
    });
  });

  describe('GET /api/delegates/getNextForgers', function () {
    it('should be ok', function (done) {
      getNextForgers((err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body).to.have.property('delegates');
        checkPublicKeys(res.body.delegates);
        done();
      });
    });
  });
});
