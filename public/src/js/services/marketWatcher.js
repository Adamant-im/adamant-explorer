'use strict';

var MarketWatcher = function ($q, $http, $scope) {
    var self = this,
        interval;
    $scope.exchanges = [];

    $scope.setTab = function (tab) {
        $scope.oldTab = $scope.tab;
        $scope.tab    = tab;

        if (!$scope.oldTab) { return; }
        console.log('Switched tab from', $scope.oldTab, 'to', $scope.tab);

        switch (tab) {
            case 'stockChart':
                if ($scope.oldTab !== 'stockChart') {
                    $scope.$broadcast('$candlesUpdated');
                }
                break;
            case 'depthChart':
                if ($scope.oldTab !== 'depthChart') {
                    $scope.$broadcast('$ordersUpdated');
                }
                break;
        }
    };

    $scope.setExchange = function (exchange, duration) {
        $scope.oldExchange = $scope.exchange;
        $scope.exchange = (exchange || $scope.exchange || _.first ($scope.exchanges));
        $scope.newExchange = ($scope.exchange !== $scope.oldExchange);
        if ($scope.newExchange) {
            console.log('Changed exchange from:', $scope.oldExchange, 'to:', $scope.exchange);
        }
        return $scope.setDuration(duration);
    };

    $scope.setDuration = function (duration) {
        $scope.oldDuration = $scope.duration;
        $scope.duration = (duration || $scope.duration || 'hour');
        $scope.newDuration = ($scope.duration !== $scope.oldDuration);
        if ($scope.newDuration) {
            console.log('Changed duration from:', $scope.oldDuration, 'to:', $scope.duration);
        }
        return getData();
    };

    var updateAll = function () {
        return $scope.newExchange || (!$scope.newExchange && !$scope.newDuration);
    };

    var getData = function () {
        console.log('New exchange:', $scope.newExchange);
        console.log('New duration:', $scope.newDuration);
        console.log('Updating all:', updateAll());

        $q.all([getCandles(), getStatistics(), getOrders()]).then(function (results) {
            if (results[0] && results[0].data) {
                $scope.candles = results[0].data.candles;
                $scope.$broadcast('$candlesUpdated');
                console.log('Candles updated');
            }
            if (results[1] && results[1].data) {
                $scope.statistics = results[1].data.statistics;
                $scope.$broadcast('$statisticsUpdated');
                console.log('Statistics updated');
            }
            if (results[2] && results[2].data) {
                $scope.orders = results[2].data.orders;
                $scope.$broadcast('$ordersUpdated');
                console.log('Orders updated');
            }
        });
    };

    var getExchanges = function () {
        console.log ('Retrieving exchanges...');
        $http.get('/api/exchanges').then (function (result) {
            if (result.data.success) {
                $scope.exchanges = _.keys (_.pick (result.data.exchanges, function (value, key) {
                    return value ? key : false;
                }));
                if ($scope.exchanges.length > 0) {
                    $scope.setExchange();
                    interval = setInterval(getData, 30000);
                }
            } else {
                $scope.exchanges = [];
            }
        });
    };

    var getCandles = function () {
        console.log('Retrieving candles...');
        return $http.get(['/api/exchanges/getCandles',
                   '?e=', angular.lowercase($scope.exchange),
                   '&d=', $scope.duration].join(''));
    };

    var getStatistics = function () {
        if (!updateAll()) { return; }
        console.log('Retrieving statistics...');
        return $http.get(['/api/exchanges/getStatistics',
                          '?e=', angular.lowercase($scope.exchange)].join(''));
    };

    var getOrders = function () {
        if (!updateAll()) { return; }
        console.log('Retrieving orders...');
        return $http.get(['/api/exchanges/getOrders',
                          '?e=', angular.lowercase($scope.exchange)].join(''));
    };

    getExchanges ();
    $scope.isCollapsed = false;

    $scope.$on('$locationChangeStart', function (event, next, current) {
        clearInterval(interval);
    });

    $scope.$on('$stockChartUpdated', function (event, next, current) {
        $scope.newExchange = $scope.newDuration = false;
    });
};

angular.module('lisk_explorer.tools').factory('marketWatcher',
  function ($q, $http, $socket) {
      return function ($scope) {
          var marketWatcher = new MarketWatcher($q, $http, $scope),
              ns = $socket('/marketWatcher');

          ns.on('data', function (res) {
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return marketWatcher;
      };
  });
