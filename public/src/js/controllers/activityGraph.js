'use strict';

angular.module('insight.activity').controller('ActivityGraph',
  function(activityGraph, $scope) {
    activityGraph($scope);
  });
