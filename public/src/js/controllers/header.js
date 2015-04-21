'use strict';

angular.module('cryptichain.system').controller('HeaderController',
  function ($scope, $rootScope, $modal, $http, $interval) {
      $scope.getHeight = function () {
          $http.get("/api/getBlocksCount").then(function (resp) {
              if (resp.data.success) {
                  $scope.totalBlocks = resp.data.count;
              } else if (!$scope.totalBlocks) {
                  $scope.totalBlocks = 0;
              }
          });
      }

      $scope.getFee = function () {
          $http.get("/api/getFee").then(function (resp) {
              if (resp.data.success) {
                  $scope.fee = resp.data.feePercent;
              } else {
                  $scope.fee = "Error";
              }
          });
      }

      $scope.getXCR = function () {
          $http.get("/api/getXCRCourse").then(function (resp) {
             if (resp.data.success) {
                 $scope.xcr = resp.data.xcr;
                 $scope.usd = resp.data.usd;
             } else {
                 $scope.course = "Error";
             }
          });
      }

      $scope.heightInterval = $interval(function () {
          $scope.getHeight();
      }, 10000);

      $scope.feeInterval = $interval(function () {
          $scope.getFee();
      }, 30000);

      $scope.xcrInterval = $interval(function () {
          $scope.getXCR();
      }, 30000);

      $scope.getHeight();
      $scope.getFee();
      $scope.getXCR();
  });
