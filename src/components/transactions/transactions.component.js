import 'angular';
import AppTransactions from './transactions.module';
import template from './transactions.html';

const TransactionsConstructor = function ($rootScope, $stateParams, $location, $http) {
    const vm = this;
    vm.getTransaction = () => {
        $http.get('/api/getTransaction', {
            params: {
                transactionId: $stateParams.txId
            }
        }).then(resp => {
            const data = resp.data;
            if (data.success) {
                if (data.transaction.amount === 0 && data.transaction.fee < 300000000) throw 'Transaction is 0 ADM!';
                vm.tx = data.transaction;
            } else {
                throw 'Transaction was not found!';
            }
        }).catch(error => {
            $location.path('/');
        });
    };

    vm.getTransaction();
};

AppTransactions.component('transactions', {
    template: template,
    controller: TransactionsConstructor,
    controllerAs: 'vm'
});