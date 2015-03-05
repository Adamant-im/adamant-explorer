'use strict';

angular.module('cryptichain.network').controller('NetworkMonitor',
  function(networkMonitor, $socket, $scope) {
      networkMonitor($socket, $scope);
  });
