'use strict';

module.exports = function (app, api) {
  this.version = function () {
    return { version: app.get('version') };
  };

  this.getPriceTicker = function (error, success) {
    if (app.get('exchange enabled')) {
      // If exchange rates are enabled - that endpoint cannot fail, in worst case we return empty object here
      return success({ success: true, tickers: exchange.tickers });
    } else {
      // We use success callback here on purpose
      return success({ success: false, error: 'Exchange rates are disabled' });
    }
  };

  this.search = function (id, error, success) {
    if (id === null) {
      return error({
        success: false,
        error: 'Missing/Invalid search criteria',
      });
    } else {
      searchHeight(id, error, success);
    }
  };

  // Private

  const exchange = app.exchange;

  const searchHeight = function (id, error, success) {
    new api.blocks(app).getHeight(
      id,
      function (body) {
        return searchBlock(id, error, success);
      },
      function (body) {
        if (body.success === true) {
          return success({ success: true, type: 'block', id: body.block.id });
        } else {
          return error({ success: false, error: body.error });
        }
      },
    );
  };

  const searchBlock = function (id, error, success) {
    new api.blocks(app).getBlock(
      id,
      function (body) {
        return searchTransaction(id, error, success);
      },
      function (body) {
        if (body.success === true) {
          return success({ success: true, type: 'block', id: body.block.id });
        } else {
          return error({ success: false, error: body.error });
        }
      },
    );
  };

  const searchTransaction = function (id, error, success) {
    new api.transactions(app).getTransaction(
      id,
      function (body) {
        return searchPublicKey(id, error, success);
      },
      function (body) {
        if (body.success === true) {
          return success({
            success: true,
            type: 'tx',
            id: body.transaction.id,
          });
        } else {
          return error({ success: false, error: body.error });
        }
      },
    );
  };

  const searchAccount = function (id, error, success) {
    new api.accounts(app).getAccount(
      { address: id },
      function (body) {
        return searchDelegates(id, error, success);
      },
      function (body) {
        if (body.success === true) {
          return success({ success: true, type: 'address', id: id });
        } else {
          return error({ success: false, error: null, found: false });
        }
      },
    );
  };

  const searchPublicKey = function (id, error, success) {
    new api.accounts(app).getAccount(
      { publicKey: id },
      function (body) {
        return searchAccount(id, error, success);
      },
      function (body) {
        if (body.success === true) {
          return success({ success: true, type: 'address', id: body.address });
        } else {
          return error({ success: false, error: null, found: false });
        }
      },
    );
  };

  const searchDelegates = function (id, error, success) {
    new api.delegates(app).getSearch(
      id,
      function (body) {
        return error({ success: false, error: body.error });
      },
      function (body) {
        if (body.success === true) {
          return success({ success: true, type: 'address', id: body.address });
        } else {
          return error({ success: false, error: null, found: false });
        }
      },
    );
  };
};
