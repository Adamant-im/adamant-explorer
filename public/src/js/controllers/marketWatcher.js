'use strict';

angular.module('cryptichain.tools').controller('MarketWatcher',
  function (marketWatcher, $scope) {
      marketWatcher($scope);
  });
