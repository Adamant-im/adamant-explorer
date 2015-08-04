'use strict';

angular.module('cryptichain.tools').controller('NetworkMonitor',
  function (networkMonitor, orderBy, $scope) {
      networkMonitor($scope);

      $scope.tables = {
          peers : orderBy('ip')
      };
  });
