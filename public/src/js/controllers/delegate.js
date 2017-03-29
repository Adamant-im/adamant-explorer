'use strict';

angular.module('lisk_explorer.address').controller('DelegateController',
  function ($scope, $rootScope, $routeParams, $location, $http, addressTxs) {
      $rootScope.breadCrumb = {address: $routeParams.delegateId};
      $scope.getAddress = function () {
          $http.get('/api/getAccount', {
              params: {
                  address: $routeParams.delegateId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.address = resp.data;
              } else {
                  throw 'Account was not found!';
              }
          }).catch(function (error) {
              $location.path('/');
          });
      };

      $scope.address = {
          address: $routeParams.delegateId
      };

      // Sets the filter for which transactions to display
      $scope.filterTxs = function(direction) {
          $scope.direction = direction;
          $scope.txs = addressTxs($routeParams.delegateId, direction);
      };

      $scope.getAddress();
      $scope.txs = addressTxs($routeParams.delegateId);
  });
