'use strict';

angular.module('lisk_explorer.blocks').controller('BlocksController',
  function ($scope, $rootScope, $routeParams, $location, $http, blockTxs) {
      $scope.getLastBlocks = function (n) {
          var offset = 0;

          if (n) {
              offset = (n - 1) * 20;
          }

          $http.get('/api/getLastBlocks?n=' + offset).then(function (resp) {
              if (resp.data.success) {
                  $scope.blocks = resp.data.blocks;

                  if (resp.data.pagination) {
                      $scope.pagination = resp.data.pagination;
                  }
              } else {
                  $scope.blocks = [];
              }
          });
      };

      $scope.getBlock = function (blockId) {
          $http.get('/api/getBlock', {
              params : {
                  blockId : blockId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.block = resp.data.block;
              } else {
                  throw 'Block was not found!';
              }
          }).catch(function (error) {
              $location.path('/');
          });
      };

      if ($routeParams.blockId) {
          $scope.block = {
              id : $routeParams.blockId
          };
          $scope.getBlock($routeParams.blockId);
          $scope.txs = blockTxs($routeParams.blockId);
      } else if ($routeParams.page) {
          $scope.getLastBlocks($routeParams.page);
      } else {
          $scope.getLastBlocks();
      }
  });
