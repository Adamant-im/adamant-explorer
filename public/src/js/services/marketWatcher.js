'use strict';

var MarketWatcher = function ($q, $http, $scope) {
    var self = this;

    $scope.setExchange = function (exchange, duration) {
        $scope.oldExchange = $scope.exchange;
        $scope.exchange = (exchange || $scope.exchange || 'Bter');
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

    var getData = function () {
        $q.all([getCandles(), getStatistics(), getOrders()]).then(function (results) {
            $scope.candles = results[0].data.candles;
            console.log('Candles updated');
            $scope.statistics = results[1].data.statistics;
            console.log('Statistics updated');
            $scope.orders = results[2].data.orders;
            console.log('Orders updated');
        });
    };

    var getCandles = function () {
        console.log('Retrieving candles...');
        return $http.get(['/api/candles/getCandles',
                   '?e=', angular.lowercase($scope.exchange),
                   '&d=', $scope.duration].join(''));
    };

    var getStatistics = function () {
        console.log('Retrieving statistics...');
        return $http.get(['/api/candles/getStatistics',
                   '?e=', angular.lowercase($scope.exchange)].join(''));
    };

    var getOrders = function () {
        console.log('Retrieving orders...');
        return $http.get(['/api/orders/getOrders',
                  '?e=', angular.lowercase($scope.exchange)].join(''));
    };

    $scope.setExchange();

    var interval = setInterval(getData, 30000);

    $scope.$on('$locationChangeStart', function (event, next, current) {
        clearInterval(interval);
    });
};

angular.module('cryptichain.tools').factory('marketWatcher',
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
