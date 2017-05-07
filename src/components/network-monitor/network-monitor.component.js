import 'angular';
import AppNetworkMonitor from './network-monitor.module';
import template from './network-monitor.html';
import './network-monitor.css';

const NetworkMonitorConstructor = function (networkMonitor) {
    networkMonitor(this);
};

AppNetworkMonitor.component('networkMonitor', {
    template: template,
    controller: NetworkMonitorConstructor,
    controllerAs: 'vm'
});
