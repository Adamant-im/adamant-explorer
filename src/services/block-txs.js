'use strict';

angular.module('lisk_explorer.system').factory('blockTxs',
  ($http, $q) => blockId => {
      const lessMore = new LessMore($http, $q, {
          url     : '/api/getTransactionsByBlock',
          parent  : 'block',
          key     : 'transactions',
          blockId : blockId
      });

      return lessMore;
  });
