'use strict';

angular.module('cryptichain.search').controller('SearchController',
  function ($scope, $routeParams, $location, $timeout, Global, $http) {
      $scope.loading = false;
      $scope.badQuery = false;

      var _badQuery = function () {
          $scope.badQuery = true;

          $timeout(function () {
              $scope.badQuery = false;
          }, 2000);
      };

      var _resetSearch = function () {
          $scope.q = '';
          $scope.loading = false;
      };

      $scope.search = function () {
          $scope.badQuery = false;
          $scope.loading = true;

          $http.get("/api/search", {
              params : {
                  id : $scope.q
              }
          }).then(function (resp) {
              if (resp.data.success == false) {
                  $scope.loading = false;
                  _badQuery();
              } else if (resp.data.id) {
                  $scope.loading = false;
                  _resetSearch();

                  $location.path("/" + resp.data.type + "/" + resp.data.id);
              }
          });
      }
  });
