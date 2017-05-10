import 'angular';
import AppDelegateMonitor from './delegate-monitor.module';
import template from './delegate-monitor.html';
import './delegate-monitor.css';

const DelegateMonitorConstructor = function (delegateMonitor, orderBy, $rootScope, $http) {
    const vm = this;
    delegateMonitor(vm);

    vm.getStandby = n => {
        let offset = 0;

        if (n) {
            offset = (n - 1) * 20;
        }

        vm.standbyDelegates = null;

        $http.get(`/api/delegates/getStandby?n=${offset}`).then(resp => {
            if (resp.data.success) {
                resp.data.delegates.forEach(deligate => {
                    deligate.proposal = $rootScope.delegateProposals[deligate.username.toLowerCase()];
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
};

AppDelegateMonitor.component('delegateMonitor', {
    template: template,
    controller: DelegateMonitorConstructor,
    controllerAs: 'vm'
});
