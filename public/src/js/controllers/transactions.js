'use strict';

angular.module('insight.transactions').controller('transactionsController',
function($scope, $rootScope, $routeParams, $location, $http) {
    $scope.getTransaction = function () {
        $http.get("/api/getTransaction", {
            params : {
                transactionId : $routeParams.txId
            }
        }).then(function (resp) {
            if (resp.data.success) {
                $scope.tx = resp.data.transaction;
            }
        });
    }

    $scope.getTransaction();
});
