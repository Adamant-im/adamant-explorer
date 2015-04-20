'use strict';

angular.module('cryptichain.blocks').controller('BlocksController',
  function ($scope, $rootScope, $routeParams, $location, $http, $interval) {
      $scope.getLastBlocks = function (n) {
          var offset = 0;

          if (n) {
              offset = (n - 1) * 20;
          }

          $scope.loading = true;

          $http.get("/api/lastBlocks?n=" + offset).then(function (resp) {
              if (resp.data.success) {
                  $scope.blocks = resp.data.blocks;

                  if (resp.data.pagination) {
                      $scope.pagination = resp.data.pagination;
                  }
              } else {
                  $scope.blocks = [];
              }

              $scope.loading = false;
          });
      }

      $scope.getBlock = function (blockId) {
          $scope.loading = true;

          $http.get("/api/getBlock", {
              params : {
                  blockId : blockId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.block = resp.data.block;
                  return $http.get("/api/getTransactionsByBlock", {
                      params : {
                          blockId : blockId
                      }
                  });
              } else {
                  throw 'Block was not found!'
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.block.transactions = resp.data.transactions;
                  $scope.loading = false;
              } else {
                  throw 'Block transactions were not found!'
              }
              $scope.txs = $scope.block.transactions;
          }).catch(function (error) {
              console.log(error);
              $location.path("/");
          });
      }

      if ($routeParams.blockId) {
          $scope.block = {
              id : $routeParams.blockId
          };
          $scope.getBlock($routeParams.blockId);
      } else if ($routeParams.page) {
          $scope.getLastBlocks($routeParams.page);
      } else {
          $scope.getLastBlocks();
      }
  });
