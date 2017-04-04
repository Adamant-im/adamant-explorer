const HomeCtrlConstructor = function ($scope, $http, $interval) {
    const vm = this;
    vm.getLastBlocks = () => {
        $http.get('/api/getLastBlocks').then(resp => {
            if (resp.data.success) {
                if (vm.blocks && vm.blocks.length > 0) {
                    if (vm.blocks[0].id !== resp.data.blocks[0].id) {
                        vm.blocks = resp.data.blocks;
                    }
                } else {
                    vm.blocks = resp.data.blocks;
                }
            }
        });
    };

    vm.blocksInterval = $interval(() => {
        vm.getLastBlocks();
    }, 30000);

    vm.getLastBlocks();

    vm.getLastTransactions = () => {
        $http.get('/api/getLastTransactions').then(resp => {
            if (resp.data.success) {
                if (vm.txs && vm.txs.length > 0) {
                    if (vm.txs[0] !== resp.data.transactions[0]) {
                        vm.txs = resp.data.transactions;
                    }
                } else {
                    vm.txs = resp.data.transactions;
                }
            }
        });
    };

    vm.transactionsInterval = $interval(() => {
        vm.getLastTransactions();
    }, 30000);

    vm.getLastTransactions();
};

angular.module('lisk_explorer.system').controller('HomeCtrl', HomeCtrlConstructor);
