'use strict';

angular.module('cryptichain.system').controller('HeaderController',
  function (header, $scope) {
      header($scope);
  });
