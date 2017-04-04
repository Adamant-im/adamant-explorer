'use strict';

angular.module('lisk_explorer.system').factory('addressTxs',
  ($http, $q) => (address, direction) => {
      const lessMore = new LessMore($http, $q, {
          url       : '/api/getTransactionsByAddress',
          parent    : 'address',
          key       : 'transactions',
          address   : address,
          direction : direction
      });

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
