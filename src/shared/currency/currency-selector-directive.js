angular.module('lisk_explorer.currency').directive ('currencySelector', ($rootScope, $timeout) => {
    const CurrencySelectorLink = () => {
        $timeout(() => {
            $rootScope.currency.symbol = localStorage && localStorage.getItem ('lisk_explorer-currency') || 'LSK';
        });
    };

    const CurrencySelectorCtrl = function() {
        this.setCurrency = currency => {
            $rootScope.currency.symbol = currency;
            if (localStorage) {
                localStorage.setItem ('lisk_explorer-currency', currency);
            }
        };
    }

    return {
        restrict: 'E',
        replace: true,
        controller: CurrencySelectorCtrl,
        controllerAs: 'cs',
        link: CurrencySelectorLink,
        templateUrl: '/shared/currency/currency-selector.html'
    }
});
