'use strict';

angular.module('lisk_explorer.address').controller('AddressController',
  function ($scope, $rootScope, $routeParams, $location, $http, addressTxs) {
      $scope.getAddress = function () {
          $http.get('/api/getAccount', {
              params : {
                  address : $routeParams.address
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
          address : $routeParams.address
      };
      
      /**
      * Sets the filter for which transactions to display
	  *
	  */
      $scope.filterTxs = function(direction) {
		  $scope.txs = addressTxs($routeParams.address, direction);
		  $scope.direction = direction;
	  };

      $scope.getAddress();
      $scope.direction=0;
      $scope.txs = addressTxs($routeParams.address);
  });
