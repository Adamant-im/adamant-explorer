'use strict';

angular.module('cryptichain.tools').controller('DelegateMonitor',
  function (delegateMonitor, $scope, $http) {
      delegateMonitor($scope);

      $scope.getStandby = function (n) {
          var offset = 0;

          if (n) {
              offset = (n - 1) * 20;
          }

          $scope.standbyDelegates = null;

          $http.get("/api/delegates/getStandby?n=" + offset).then(function (resp) {
              if (resp.data.success) {
                  $scope.standbyDelegates = resp.data.delegates;
              }
              if (resp.data.pagination) {
                  $scope.pagination = resp.data.pagination;
              }
          });
      }

      $scope.getStandby(1);
  });
