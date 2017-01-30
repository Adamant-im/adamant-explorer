'use strict';

angular.module ('lisk_explorer.currency').controller ('CurrencyController',
  function ($scope, $rootScope) {
    $rootScope.currency.symbol = localStorage && localStorage.getItem ('lisk_explorer-currency') || 'LSK';

    $scope.setCurrency = function(currency) {
      $rootScope.currency.symbol = currency;
      if (localStorage) {
        localStorage.setItem ('lisk_explorer-currency', currency);
      }
    };
  });
