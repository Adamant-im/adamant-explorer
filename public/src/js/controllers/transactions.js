'use strict';

angular.module('lisk_explorer.transactions').controller('TransactionsController',
  function ($scope, $rootScope, $routeParams, $location, $http) {
      $scope.getTransaction = function () {
          $http.get('/api/getTransaction', {
              params : {
                  transactionId : $routeParams.txId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.tx = resp.data.transaction;
              } else {
                  throw 'Transaction was not found!';
              }
          }).catch(function (error) {
              $location.path('/');
          });
      };

      $scope.getTransaction();
  });
