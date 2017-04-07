'use strict';

angular.module('lisk_explorer.tools')
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
          restrict: 'A',
          scope: {
              os: '=os',
              brand: '=brand'
          },
          template: '<span></span>',
          replace: true,
          link: function (scope, element, attr) {
              var el = element[0];

              el.alt = el.title = scope.os;
              el.className += (' os-icon os-' + scope.brand.name);
          }
      };
  });
