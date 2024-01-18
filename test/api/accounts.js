const testUtils = require('../testUtils.js');

const params = {
  address: 'U765119166770892012',
  address_delegate: 'U9466395914658764774',
  excessive_offset: '1000000',
  publicKey: '4016ab8e8b7f60eca2e3c77adfd68c6eba1e83a580c1e6052ffae44056779a3c',
};

describe('Accounts API', function () {
  /*Define functions for use within tests*/
  function getAccount(id, done) {
    testUtils.httpRequest.get('/api/getAccount?address=' + id, done);
  }

  function getAccountByPublicKey(pk, done) {
    testUtils.httpRequest.get('/api/getAccount?publicKey=' + pk, done);
  }

  function getTopAccounts(id, id2, done) {
    testUtils.httpRequest.get('/api/getTopAccounts?offset=' + id + '&limit=' + id2, done);
  }

  function checkAccount(id) {
    testUtils
      .expect(id)
      .to.have.all.keys(
        'success',
        'multisignatures',
        'secondPublicKey',
        'secondSignature',
        'unconfirmedSignature',
        'publicKey',
        'balance',
        'unconfirmedBalance',
        'address',
        'u_multisignatures',
        'knowledge',
        'delegate',
        'votes',
        'voters',
        'incoming_cnt',
        'outgoing_cnt',
      );
  }

  function checkTopAccounts(id) {
    for (let i = 0; i < id.length; i++) {
      if (id[i + 1]) {
        checkTopAccount(id[i]);
      }
    }
  }

  function checkTopAccount(id) {
    testUtils
      .expect(id)
      .to.have.all.keys('address', 'balance', 'publicKey', 'knowledge');
  }

  /*Define api endpoints to test */
  describe('GET /api/getAccount', function () {
    it('using known address should be ok', function (done) {
      getAccount(params.address, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        checkAccount(res.body);
        done();
      });
    });

    it('using invalid address should fail', function (done) {
      getAccount('L', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error');
        done();
      });
    });

    it('using unknown address should fail', function (done) {
      getAccount('999999999L', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error');
        done();
      });
    });

    it('using no address should fail', function (done) {
      getAccount('', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error');
        done();
      });
    });

    it('using known pk should be ok', function (done) {
      getAccountByPublicKey(params.publicKey, (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        checkAccount(res.body);
        done();
      });
    });

    it('using invalid pk should fail', function (done) {
      getAccountByPublicKey('invalid_pk', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error');
        done();
      });
    });

    it('using unknown pk should fail', function (done) {
      getAccountByPublicKey(
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        (err, res) => {
          testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
          testUtils.expect(res.body).to.have.property('error');
          done();
        },
      );
    });

    it('using no pk should fail', function (done) {
      getAccountByPublicKey('', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.not.ok;
        testUtils.expect(res.body).to.have.property('error');
        done();
      });
    });
  });

  /* -- if all fail, check adamant for topAccounts = true */
  describe('GET /api/getTopAccounts', function () {
    it('using offset 0 and limit 100 should return 100', function (done) {
      getTopAccounts('0', '100', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.accounts.length).to.equal(100);
        checkTopAccounts(res.body.accounts);
        done();
      });
    });

    it('using offset 0 and limit 1 should return 1', function (done) {
      getTopAccounts('0', '1', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.accounts.length).to.equal(1);
        checkTopAccounts(res.body.accounts);
        done();
      });
    });

    it('using offset 100 and limit 50 should return 50', function (done) {
      getTopAccounts('100', '50', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.accounts.length).to.equal(50);
        checkTopAccounts(res.body.accounts);
        done();
      });
    });

    it('using offset 0 and limit 0 should return 100', function (done) {
      getTopAccounts('0', '0', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.accounts.length).to.equal(100);
        checkTopAccounts(res.body.accounts);
        done();
      });
    });

    it('using offset 0 and limit -1 and return 100', function (done) {
      getTopAccounts('0', '-1', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.accounts.length).to.equal(100);
        checkTopAccounts(res.body.accounts);
        done();
      });
    });

    it('using offset 100000 and no limit should return 0', function (done) {
      getTopAccounts(params.excessive_offset, '', (err, res) => {
        testUtils.expect(res.body).to.have.property('success').to.be.ok;
        testUtils.expect(res.body.accounts.length).to.equal(0);
        done();
      });
    });
  });
});
