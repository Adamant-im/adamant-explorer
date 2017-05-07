'use strict';
import AppTools from '../../app/app-tools.module';
import template from './transaction-item.html';

const transactionsItem = AppTools.directive('transactionItem', () => ({
    template,
    repalce: true,
    scope: {
      tx: '='
    },
}));

export default transactionsItem;