'use strict';

var MarketWatcher = function ($scope, stockChart) {
    this.$scope = $scope;
    this.chart  = stockChart($scope);
};

angular.module('cryptichain.tools').factory('marketWatcher',
  function ($socket, stockChart) {
      return function ($scope) {
          var marketWatcher = new MarketWatcher($scope, stockChart),
              ns = $socket('/marketWatcher');

          ns.on('data', function (res) {
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return marketWatcher;
      };
  });
