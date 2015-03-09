'use strict';

angular.module('cryptichain.network').controller('NetworkMonitor',
  function(networkMonitor, $scope) {
      networkMonitor($scope);
  });
