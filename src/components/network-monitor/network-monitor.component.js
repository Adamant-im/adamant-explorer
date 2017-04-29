import 'angular';
import AppNetworkMonitor from './index';

const NetworkMonitorCtrlConstructor = function (networkMonitor) {
    networkMonitor(this);
};

AppNetworkMonitor.controller('NetworkMonitorCtrl', NetworkMonitorCtrlConstructor);
