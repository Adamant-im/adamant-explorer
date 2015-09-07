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
  })
  .directive('osIcon', function () {
      return {
          restric: 'A',
          replace: true,
          template: '<span class="os-icon os-"></span>',
          link: function (scope, elm, attr) {
              elm[0].alt = elm[0].title = attr.os;
              elm[0].className = elm[0].className + attr.brand;
          }
      };
  });
