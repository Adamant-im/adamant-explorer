'use strict';

angular.module('cryptichain.tools').controller('NetworkMonitor',
  function (networkMonitor, $scope) {
      networkMonitor($scope);
  });
