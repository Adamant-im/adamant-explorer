'use strict';

angular.module('cryptichain.activity').controller('ActivityGraph',
  function(activityGraph, $scope) {
      activityGraph($scope);
  });
