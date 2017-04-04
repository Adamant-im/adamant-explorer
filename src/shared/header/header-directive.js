'use strict';

/**
 * 
 * @todo Fix the service usage
 * 
 */
const HeaderCtrlConstructor = () => {
    $rootScope.currency = {
      symbol: 'LSK'
    };

    const header = new Header($rootScope), ns = $socket('/header');

    ns.on('data', res => {
        if (res.status) { header.updateBlockStatus(res.status); }
        if (res.ticker) { header.updatePriceTicker(res.ticker); }
    });

    ns.on('delegateProposals', res => {
        if (res) { header.updateDelegateProposals(res); }
    });


    $rootScope.$on('$destroy', event => {
        ns.removeAllListeners();
    });
};

angular.module('lisk_explorer.system').directive('HeaderCtrl', ($socket, $rootScope, header) => {
    return {
        restrict: 'E',
        link: HeaderCtrlConstructor,
        templateUrl: '/shared/header/header.html'
    }
});


