'use strict';

angular.module('lisk_explorer.address').controller('AddressController',
  function ($scope, $rootScope, $stateParams, $location, $http, addressTxs) {
      $scope.getAddress = function () {
          $http.get('/api/getAccount', {
              params: {
                  address: $stateParams.address
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
          address: $stateParams.address
      };

      // Sets the filter for which transactions to display
      $scope.filterTxs = function (direction) {
          $scope.direction = direction;
          $scope.txs = addressTxs($stateParams.address, direction);
      };

      $scope.getAddress();
      $scope.txs = addressTxs($stateParams.address);
  });
