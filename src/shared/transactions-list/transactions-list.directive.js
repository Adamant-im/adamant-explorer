'use strict';
import AppTools from '../../app/app-tools.module';
import template from './transactions-list.html';

const transactionsList = AppTools.directive('transactionsList', (orderBy) => ({
    template,
    scope: {
      txs: '=',
      address: '='
    },
    link: ($scope) => {
      $scope.filter = orderBy('date');
    }
}));

export default transactionsList;
