'use strict';

var DelegateMonitorCtrlConstructor = function (delegateMonitor, orderBy, $rootScope, $http) {
    var vm = this;
    delegateMonitor(vm);

    vm.getStandby = function (n) {
        var offset = 0;

        if (n) {
            offset = (n - 1) * 20;
        }

        vm.standbyDelegates = null;

        $http.get('/api/delegates/getStandby?n=' + offset).then(function (resp) {
            if (resp.data.success) {
                _.each(resp.data.delegates, function (deligate) {
                    deligate.proposal = _.find ($rootScope.delegateProposals, function (proposal) {
                    return proposal.name === deligate.username.toLowerCase ();
                    });
                });

                vm.standbyDelegates = resp.data.delegates;
            }
            if (resp.data.pagination) {
                vm.pagination = resp.data.pagination;
            }
        });
    };

    vm.getStandby(1);

    vm.tables = {
        active: orderBy('rate'),
        standby: orderBy('rate')
    };
}

angular.module('lisk_explorer.tools').controller('DelegateMonitorCtrl', DelegateMonitorCtrlConstructor);
