'use strict';

var TransactionsCtrlConstructor = function ($rootScope, $stateParams, $location, $http) {
    var vm = this;

    vm.getTransaction = function () {
        $http.get('/api/getTransaction', {
            params : {
                transactionId : $stateParams.txId
            }
        }).then(function (resp) {
            if (resp.data.success) {
                vm.tx = resp.data.transaction;
            } else {
                throw 'Transaction was not found!';
            }
        }).catch(function (error) {
            $location.path('/');
        });
    };

    vm.getTransaction();
}

angular.module('lisk_explorer.transactions').controller('TransactionsCtrl', TransactionsCtrlConstructor);
