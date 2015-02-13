'use strict';

angular.module('insight.network').controller('NetworkMonitor',
  function(networkMonitor, $socket, $scope) {
      networkMonitor($socket, $scope);
  });
