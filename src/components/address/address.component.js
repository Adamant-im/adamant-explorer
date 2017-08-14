import 'angular';
import AppAddress from './address.module';
import template from './address.html';

const AddressConstructor = function ($rootScope, $stateParams, $location, $http, addressTxs) {
    const vm = this;
    vm.getAddress = () => {
        $http.get('/api/getAccount', {
            params: {
                address: $stateParams.address
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
        address: $stateParams.address
    };

    // Sets the filter for which transactions to display
    vm.filterTxs = direction => {
        vm.direction = direction;
        vm.txs = addressTxs({ address: $stateParams.address, direction });
    };

    vm.searchParams = [];
    vm.availableSearchParams = [
        { key: 'senderId', name: 'Sender', placeholder: 'Sender...' },
        { key: 'recipientId', name: 'Recipient', placeholder: 'Recipient...' },
        { key: 'minAmount', name: 'Min', placeholder: 'Min Amount...' },
        { key: 'maxAmount', name: 'Max', placeholder: 'Max Amount...' },
        { key: 'type', name: 'Type', placeholder: 'Comma separated...' },
        { key: 'senderPublicKey', name: 'SenderPk', placeholder: 'Sender Public Key...' },
        { key: 'recipientPublicKey', name: 'RecipientPk', placeholder: 'Recipient Public Key...' },
        { key: 'minConfirmations', name: 'Min Confirmations', placeholder: 'Minimum Confirmations...' },
        { key: 'blockId', name: 'blockId', placeholder:'Block Id...' },
        { key: 'fromHeight', name: 'fromHeight', placeholder:'From Height...' },
        { key: 'toHeight', name: 'toHeight', placeholder:'To Height...' },
        { key: 'fromTimestamp', name: 'fromTimestamp', placeholder:'From Timestamp...' },
        { key: 'toTimestamp', name: 'toTimestamp', placeholder:'To Timestamp...' },
        { key: 'limit', name: 'limit', placeholder:'Limit...' },
        { key: 'offset', name: 'offset', placeholder:'Offset...' },
        { key: 'orderBy', name: 'orderBy', placeholder:'Order By...' },
    ];
    vm.parametersDisplayLimit = vm.availableSearchParams.length;

    vm.onFiltersUsed = () => {
        vm.cleanByFilters = true;
        let { removeAll } = angular.element(document.getElementsByClassName('search-parameter-input')[0]).scope();
        if (removeAll) {
            removeAll();
        }
    };

    const onSearchBoxCleaned = () => {
        if (vm.cleanByFilters) {
            vm.cleanByFilters = false;
        } else {
            vm.invalidParams = false;
            vm.filterTxs(vm.lastDirection)
            vm.txs.loadData();
        }
    };

    const searchByParams = (params) => {
        if (vm.direction !== 'search') {
            vm.lastDirection = vm.direction;
            vm.direction = 'search';
        }
        vm.invalidParams = false;
        vm.txs = addressTxs(params);
        vm.txs.loadData();
    };

    const isValidAddress = id => /([0-9]+)L$/.test(id);

    $rootScope.$on('advanced-searchbox:modelUpdated', function (event, model) {
        const params = {};
        Object.keys(model).forEach((key) => {
            if (model[key] != undefined && model[key] !== '') {
                params[key] = model[key];
            }
            if ((key === 'minAmount' || key === 'maxAmount') && params[key] !== '') {
                params[key] = Math.floor(parseFloat(params[key]) * 1e8);
            }
        });

        if (Object.keys(params).length > 0 && !params.recipientId && !params.senderId) {
            params.recipientId = $stateParams.address;
            params.senderId = $stateParams.address;
        }

        if (Object.keys(params).length > 0 && (isValidAddress(params.recipientId) || isValidAddress(params.senderId))) {
            searchByParams(params);
        } else if (Object.keys(model).length === 0) {
            onSearchBoxCleaned();
        } else {
            vm.invalidParams = true;
        }
    });
    $rootScope.$on('advanced-searchbox:removedAllSearchParam', function (event) {
        onSearchBoxCleaned();
    });

    vm.getAddress();
    vm.txs = addressTxs({ address: $stateParams.address });
};

AppAddress.component('address', {
    template: template,
    controller: AddressConstructor,
    controllerAs: 'vm'
});
