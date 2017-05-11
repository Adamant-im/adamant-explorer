import AppMarketWatcher from './market-watcher.module';

const MarketWatcher = function ($q, $http, $rootScope, vm) {
    const self = this;
    let interval;

    vm.setTab = tab => {
        vm.oldTab = vm.tab;
        vm.tab    = tab;

        if (!vm.oldTab) { return; }
        console.log('Switched tab from', vm.oldTab, 'to', vm.tab);

        switch (tab) {
            case 'stockChart':
                if (vm.oldTab !== 'stockChart') {
                    $rootScope.$broadcast('$candlesUpdated');
                }
                break;
            case 'depthChart':
                if (vm.oldTab !== 'depthChart') {
                    $rootScope.$broadcast('$ordersUpdated');
                }
                break;
        }
    };

    vm.setExchange = (exchange, duration) => {
        vm.oldExchange = vm.exchange;
        vm.exchange = (exchange || vm.exchange || vm.exchanges[0]);
        vm.newExchange = (vm.exchange !== vm.oldExchange);
        if (vm.newExchange) {
            console.log('Changed exchange from:', vm.oldExchange, 'to:', vm.exchange);
        }
        return vm.setDuration(duration);
    };

    vm.setDuration = duration => {
        vm.oldDuration = vm.duration;
        vm.duration = (duration || vm.duration || 'hour');
        vm.newDuration = (vm.duration !== vm.oldDuration);
        if (vm.newDuration) {
            console.log('Changed duration from:', vm.oldDuration, 'to:', vm.duration);
        }
        return getData();
    };

    const updateAll = () => vm.newExchange || (!vm.newExchange && !vm.newDuration);

    var getData = () => {
        console.log('New exchange:', vm.newExchange);
        console.log('New duration:', vm.newDuration);
        console.log('Updating all:', updateAll());

        $q.all([getCandles(), getStatistics(), getOrders()]).then(results => {
            if (results[0] && results[0].data) {
                vm.candles = results[0].data.candles;
                $rootScope.$broadcast('$candlesUpdated');
                console.log('Candles updated');
            }
            if (results[1] && results[1].data) {
                vm.statistics = results[1].data.statistics;
                $rootScope.$broadcast('$statisticsUpdated');
                console.log('Statistics updated');
            }
            if (results[2] && results[2].data) {
                vm.orders = results[2].data.orders;
                $rootScope.$broadcast('$ordersUpdated');
                console.log('Orders updated');
            }
        });
    };

    const getExchanges = () => {
        console.log ('Retrieving exchanges...');
        $http.get('/api/exchanges').then (result => {
            if (result.data.success) {
                vm.exchangeLogos = {};
                vm.exchanges = Object.keys(result.data.exchanges).filter((key, idx) => {
                    System.import('../../assets/img/exchanges/' + key + '.png').then((value) => {
                        vm.exchangeLogos[key] = value;
                    });
                    if (result.data.exchanges[key]) return key;
                });

                if (vm.exchanges.length > 0) {
                    vm.setExchange();
                    interval = setInterval(getData, 30000);
                }
            } else {
                vm.exchanges = [];
                vm.noExchange = true;
                $rootScope.noExchange = true;
            }
        });
    };

    var getCandles = () => {
        console.log('Retrieving candles...');
        return $http.get(['/api/exchanges/getCandles',
                   '?e=', angular.lowercase(vm.exchange),
                   '&d=', vm.duration].join(''));
    };

    var getStatistics = () => {
        if (!updateAll()) { return; }
        console.log('Retrieving statistics...');
        return $http.get(['/api/exchanges/getStatistics',
                          '?e=', angular.lowercase(vm.exchange)].join(''));
    };

    var getOrders = () => {
        if (!updateAll()) { return; }
        console.log('Retrieving orders...');
        return $http.get(['/api/exchanges/getOrders',
                          '?e=', angular.lowercase(vm.exchange)].join(''));
    };

    getExchanges ();
    vm.isCollapsed = false;

    $rootScope.$on('$locationChangeStart', (event, next, current) => {
        clearInterval(interval);
    });

    $rootScope.$on('$stockChartUpdated', (event, next, current) => {
        vm.newExchange = vm.newDuration = false;
    });
};

AppMarketWatcher.factory('marketWatcher',
  ($q, $http, $socket, $rootScope) => vm => {
      const marketWatcher = new MarketWatcher($q, $http, $rootScope, vm), ns = $socket('/marketWatcher');

      ns.on('data', res => {
      });

      $rootScope.$on('$destroy', event => {
          ns.removeAllListeners();
      });

      $rootScope.$on('$stateChangeStart', (event, next, current) => {
          ns.emit('forceDisconnect');
      });

      return marketWatcher;
  });
