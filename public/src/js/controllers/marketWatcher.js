'use strict';

var MarketWatcherCtrlConstructor = function (marketWatcher) {
    marketWatcher(this);
}

angular.module('lisk_explorer.tools').controller('MarketWatcherCtrl', MarketWatcherCtrlConstructor);
