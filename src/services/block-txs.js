import AppServices from './services.module';
import LessMore from './less-more';

AppServices.factory('blockTxs',
  ($http, $q) => blockId => {
      const lessMore = new LessMore($http, $q, {
          url     : '/api/getTransactionsByBlock',
          parent  : 'block',
          key     : 'transactions',
          blockId : blockId
      });

      return lessMore;
  });
