import 'angular';
import AppCurrency from './currency-selector.module';
import template from './currency-selector.html';

AppCurrency.directive ('currencySelector', ($rootScope, $timeout) => {
    const CurrencySelectorLink = () => {
        $timeout(() => {
            $rootScope.currency.symbol = localStorage && localStorage.getItem ('adamant_explorer-currency') || 'ADM';
        });
    };

    const CurrencySelectorCtrl = function() {
        this.setCurrency = currency => {
            $rootScope.currency.symbol = currency;
            if (localStorage) {
                localStorage.setItem ('adamant_explorer-currency', currency);
            }
        };
    }

    return {
        restrict: 'E',
        replace: true,
        controller: CurrencySelectorCtrl,
        controllerAs: 'cs',
        link: CurrencySelectorLink,
        template: template
    }
});
