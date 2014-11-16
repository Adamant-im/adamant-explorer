'use strict';

angular.module('insight.address').controller('TopAccounts',
    function($scope, $rootScope, $routeParams, $location, $http) {
        $scope.getTopAccounts = function () {
            $http.get("/api/getTopAccounts").then(function (resp) {
                if (resp.data.success) {
                    $scope.topAccounts = resp.data.accounts;
                }
            });
        }

        $scope.getTopAccounts();
    });