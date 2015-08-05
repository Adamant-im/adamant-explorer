'use strict';

var MarketWatcher = function ($http, $scope) {
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
        return getCandles();
    };

    var getCandles = function () {
        console.log('Retrieving candles...');
        $http.get(['/api/candles/getCandles',
                   '?e=', angular.lowercase($scope.exchange),
                   '&d=', $scope.duration].join('')).then(updateCandles);
    };

    var updateCandles = function (resp) {
        if (resp.data.success) {
            $scope.candles = resp.data.candles;
            console.log('Candles updated');
        }

        return getStatistics();
    };

    var getStatistics = function () {
        console.log('Retrieving statistics...');
        $http.get(['/api/candles/getStatistics',
                   '?e=', angular.lowercase($scope.exchange)].join('')).then(updateStatistics);
    };

    var updateStatistics = function (resp) {
        if (resp.data.success) {
            $scope.statistics = resp.data.statistics;
            console.log('Statistics updated');
        }
    };

    $scope.setExchange();

    var interval = setInterval(getCandles, 30000);

    $scope.$on('$locationChangeStart', function (event, next, current) {
        clearInterval(interval);
    });
};

angular.module('cryptichain.tools').factory('marketWatcher',
  function ($http, $socket) {
      return function ($scope) {
          var marketWatcher = new MarketWatcher($http, $scope),
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
