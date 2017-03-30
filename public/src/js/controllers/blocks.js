'use strict';

var BlocksCtrlConstructor = function ($rootScope, $stateParams, $location, $http, blockTxs) {
    var vm = this;

    vm.getLastBlocks = function (n) {
        var offset = 0;

        if (n) {
            offset = (n - 1) * 20;
        }

        $http.get('/api/getLastBlocks?n=' + offset).then(function (resp) {
            if (resp.data.success) {
                vm.blocks = resp.data.blocks;

                if (resp.data.pagination) {
                    vm.pagination = resp.data.pagination;
                }
            } else {
                vm.blocks = [];
            }
        });
    };

    vm.getBlock = function (blockId) {
        $http.get('/api/getBlock', {
            params : {
                blockId : blockId
            }
        }).then(function (resp) {
            if (resp.data.success) {
                vm.block = resp.data.block;
            } else {
                throw 'Block was not found!';
            }
        }).catch(function (error) {
            $location.path('/');
        });
    };

    if ($stateParams.blockId) {
        vm.block = {
            id : $stateParams.blockId
        };
        vm.getBlock($stateParams.blockId);
        vm.txs = blockTxs($stateParams.blockId);
    } else if ($stateParams.page) {
        vm.getLastBlocks($stateParams.page);
    } else {
        vm.getLastBlocks();
    }
}

angular.module('lisk_explorer.blocks').controller('BlocksCtrl', BlocksCtrlConstructor);
