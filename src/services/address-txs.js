import AppServices from './services.module';
import LessMore from './less-more';

AppServices.factory('addressTxs',
  ($http, $q) => (data) => {
      const params = Object.assign({}, data, {
        url : '/api/getTransactionsByAddress',
        parent : 'address',
        key : 'transactions',
      });
      const lessMore = new LessMore($http, $q, params);

      lessMore.loadMore = function () {
          this.getData(0, 1, data => {
              let changed = false;

              if (this.results[0] && data[0]) {
                  changed = (this.results[0].id !== data[0].id);
              }
              if (changed) {
                  this.reloadMore();
              } else {
                  LessMore.prototype.loadMore.call(this);
              }
          });
      };

      return lessMore;
  });
