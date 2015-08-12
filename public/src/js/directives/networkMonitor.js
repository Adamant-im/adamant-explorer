'use strict';

angular.module('cryptichain.tools')
  .directive('peers', function (orderBy) {
      return {
          restrict: 'E',
          scope: { peers: '=' },
          templateUrl: '/views/networkMonitor/peers.html',
          replace: true,
          link: function (scope, element, attr) {
              scope.table = orderBy('ip');
          }
      };
  });
