import 'angular';
import AppDelegate from './delegate.module';
import template from './delegate.html';

const DelegateConstructor = function ($rootScope, $stateParams, $location, $http, addressTxs) {
    const vm = this;
    $rootScope.breadCrumb = {address: $stateParams.delegateId};
    vm.getAddress = () => {
        $http.get('/api/getAccount', {
            params: {
                address: $stateParams.delegateId
            }
        }).then(resp => {
            if (resp.data.success) {
                vm.address = resp.data;
            } else {
                throw 'Account was not found!';
            }
        }).catch(error => {
            $location.path('/');
        });
    };

    vm.address = {
        address: $stateParams.delegateId
    };

    // Sets the filter for which transactions to display
    vm.filterTxs = direction => {
        vm.direction = direction;
        vm.txs = addressTxs($stateParams.delegateId, direction);
    };

    vm.getAddress();
    vm.txs = addressTxs($stateParams.delegateId);
};

AppDelegate.component('delegate', {
    template: template,
    controller: DelegateConstructor,
    controllerAs: 'vm'
});
