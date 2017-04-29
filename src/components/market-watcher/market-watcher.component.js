import 'angular';
import AppMarketWatcher from './index';

const MarketWatcherCtrlConstructor = function (marketWatcher) {
    marketWatcher(this);
};

AppMarketWatcher.controller('MarketWatcherCtrl', MarketWatcherCtrlConstructor);
