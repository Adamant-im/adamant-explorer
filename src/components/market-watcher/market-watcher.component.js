import 'angular';
import AppMarketWatcher from './market-watcher.module';
import template from './market-watcher.html';
import './market-watcher.css';

const MarketWatcherConstructor = function (marketWatcher) {
    marketWatcher(this);
};

AppMarketWatcher.component('marketWatcher', {
    template: template,
    controller: MarketWatcherConstructor,
    controllerAs: 'vm'
});
