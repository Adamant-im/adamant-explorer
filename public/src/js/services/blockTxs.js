'use strict';

angular.module('cryptichain.system').factory('blockTxs',
  function ($http, $q) {
      return function (blockId) {
          var lessMore = new LessMore($http, $q, {
              url     : "/api/getTransactionsByBlock",
              parent  : "block",
              key     : "transactions",
              blockId : blockId
          });

          return lessMore;
      }
  });
