'use strict';

angular.module('cryptichain.address').controller('AddressController',
  function($scope, $rootScope, $routeParams, $location, $http) {
      $scope.getAddress = function () {
          $http.get("/api/getAccount", {
              params : {
                  address : $routeParams.address
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.address = resp.data;
              }
          });
      }

      $scope.loadTrs = function () {
          $http.get("/api/getTransactionsByAddress", {
              params : {
                  address : $routeParams.address
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.txs = resp.data.transactions;
              }
          });
      }

      $scope.loadMore = function () {

      }

      $scope.address = {
          address : $routeParams.address
      };

      $scope.getAddress();
  });
