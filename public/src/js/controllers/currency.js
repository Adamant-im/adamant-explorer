'use strict';

/**
 *
 * @todo Move this to a directive instead
 *
 */
var CurrencyCtrlConstructor = function ($rootScope) {
    $rootScope.currency.symbol = localStorage && localStorage.getItem ('lisk_explorer-currency') || 'LSK';

    this.setCurrency = function (currency) {
        $rootScope.currency.symbol = currency;
        if (localStorage) {
            localStorage.setItem ('lisk_explorer-currency', currency);
        }
    };
}

angular.module('lisk_explorer.currency').controller ('CurrencyCtrl', CurrencyCtrlConstructor);
