'use strict';

var NetworkMonitorCtrlConstructor = function (networkMonitor) {
    networkMonitor(this);
}

angular.module('lisk_explorer.tools').controller('NetworkMonitorCtrl', NetworkMonitorCtrlConstructor);
