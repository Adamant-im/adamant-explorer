'use strict';

angular.module('lisk_explorer.system').controller('IndexController',
  function ($scope, $http, $interval) {
      $scope.getLastBlocks = function () {
          $http.get('/api/getLastBlocks').then(function (resp) {
              if (resp.data.success) {
                  if ($scope.blocks && $scope.blocks.length > 0) {
                      if ($scope.blocks[0].id !== resp.data.blocks[0].id) {
                          $scope.blocks = resp.data.blocks;
                      }
                  } else {
                      $scope.blocks = resp.data.blocks;
                  }
              }
          });
      };

      $scope.blocksInterval = $interval(function () {
          $scope.getLastBlocks();
      }, 30000);

      $scope.getLastBlocks();

      $scope.getLastTransactions = function () {
          $http.get('/api/getLastTransactions').then(function (resp) {
              if (resp.data.success) {
                  if ($scope.txs && $scope.txs.length > 0) {
                      if ($scope.txs[0] !== resp.data.transactions[0]) {
                          $scope.txs = resp.data.transactions;
                      }
                  } else {
                      $scope.txs = resp.data.transactions;
                  }
              }
          });
      };

      $scope.transactionsInterval = $interval(function () {
          $scope.getLastTransactions();
      }, 30000);

      $scope.getLastTransactions();
  });
