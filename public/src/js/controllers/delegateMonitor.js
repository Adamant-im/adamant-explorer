'use strict';

angular.module('lisk_explorer.tools').controller('DelegateMonitor',
  function (delegateMonitor, orderBy, $scope, $rootScope, $http) {
      delegateMonitor($scope);

      $scope.getStandby = function (n) {
          var offset = 0;

          if (n) {
              offset = (n - 1) * 20;
          }

          $scope.standbyDelegates = null;

          $http.get('/api/delegates/getStandby?n=' + offset).then(function (resp) {
              if (resp.data.success) {
                  _.each(resp.data.delegates, function (d) {
                      d.proposal = _.find ($rootScope.delegateProposals, function (p) {
                        return p.name === d.username.toLowerCase ();
                      });
                  });

                  $scope.standbyDelegates = resp.data.delegates;
              }
              if (resp.data.pagination) {
                  $scope.pagination = resp.data.pagination;
              }
          });
      };

      $scope.getStandby(1);

      $scope.tables = {
          active : orderBy('rate'),
          standby : orderBy('rate')
      };
  });
