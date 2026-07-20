const testUtils = require('../testUtils');

describe('Delegates API', function () {
  /**
   * Request one standby-delegate page.
   * @param {string|number} offset Row offset after the 101 active delegates
   * @param {Function} done Mocha callback
   */
  function getStandby(offset, done) {
    const query = offset === '' ? '' : `?n=${offset}`;
    testUtils.httpRequest.get(`/api/delegates/getStandby${query}`, done);
  }

  /**
   * Verify fields consumed by Delegate Monitor.
   * @param {Array<Object>} delegates Standby delegate page
   */
  function checkDelegates(delegates) {
    for (const delegate of delegates) {
      testUtils
        .expect(delegate)
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
  }

  describe('GET /api/delegates/getStandby', function () {
    for (const offset of ['', 0, 20]) {
      it(`returns the standby page at offset ${offset || 'default'}`, function (done) {
        getStandby(offset, (err, res) => {
          testUtils.expect(res.body).to.have.property('success').to.be.ok;
          testUtils.expect(res.body).to.have.property('delegates').that.is.an('array');
          testUtils.expect(res.body).to.have.property('pagination');
          testUtils.expect(res.body).to.have.property('totalCount');
          testUtils.expect(res.body.pagination).to.have.property('currentPage');
          checkDelegates(res.body.delegates);
          done(err);
        });
      });
    }
  });
});
