const TransactionsCtrlConstructor = function ($rootScope, $stateParams, $location, $http) {
    const vm = this;
    vm.getTransaction = () => {
        $http.get('/api/getTransaction', {
            params : {
                transactionId : $stateParams.txId
            }
        }).then(resp => {
            if (resp.data.success) {
                vm.tx = resp.data.transaction;
            } else {
                throw 'Transaction was not found!';
            }
        }).catch(error => {
            $location.path('/');
        });
    };

    vm.getTransaction();
};

angular.module('lisk_explorer.transactions').controller('TransactionsCtrl', TransactionsCtrlConstructor);
