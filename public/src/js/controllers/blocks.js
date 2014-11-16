'use strict';

angular.module('insight.blocks').controller('BlocksController',
  function($scope, $rootScope, $routeParams, $location, $http, $interval) {
      $scope.getLastBlocks = function (n) {
          var offset = 0;
          if (n) {
              offset = (n - 1) * 20;
          }

          $http.get("/api/lastBlocks?n=" + offset).then(function (resp) {
              if (resp.data.success) {
                  $scope.blocks = resp.data.blocks;

                  if (resp.data.pagination) {
                      $scope.pagination = resp.data.pagination;
                  }
              } else {
                  $scope.blocks = [];
              }
          });
      }

      $scope.getBlock = function (blockId) {
          $http.get("/api/getBlock", {
              params : {
                  blockId : blockId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.block = resp.data.block;
                  $scope.txs = $scope.block.transactions;
              } else {
                  $location.path("/");
              }
          });
      }

      if ($routeParams.blockId) {
          $scope.block = {
              id : $routeParams.blockId
          };

          $scope.getBlock($routeParams.blockId);
      } else {
          if ($routeParams.blockDate) {
              $scope.getLastBlocks($routeParams.blockDate);
          } else {
              $scope.getLastBlocks();
          }
      }
});
