'use strict';

angular.module('lisk_explorer.tools')
  .directive('orders', () => ({
    restrict: 'E',

    scope: {
        orders: '=orders',
        heading: '@heading',
        name: '@name'
    },

    templateUrl: '/shared/orders/orders.html',
    replace: true
}));
