'use strict';

var DelegateCtrlConstructor = function ($rootScope, $stateParams, $location, $http, addressTxs) {
    var vm = this;

    $rootScope.breadCrumb = {address: $stateParams.delegateId};

    vm.getAddress = function () {
        $http.get('/api/getAccount', {
            params: {
                address: $stateParams.delegateId
            }
        }).then(function (resp) {
            if (resp.data.success) {
                vm.address = resp.data;
            } else {
                throw 'Account was not found!';
            }
        }).catch(function (error) {
            $location.path('/');
        });
    };

    vm.address = {
        address: $stateParams.delegateId
    };

    // Sets the filter for which transactions to display
    vm.filterTxs = function(direction) {
        vm.direction = direction;
        vm.txs = addressTxs($stateParams.delegateId, direction);
    };

    vm.getAddress();
    vm.txs = addressTxs($stateParams.delegateId);
}

angular.module('lisk_explorer.address').controller('DelegateCtrl', DelegateCtrlConstructor);
