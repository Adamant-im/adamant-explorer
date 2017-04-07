/**
 * 
 * @todo Fix the service usage
 * 
 */
const HeaderLink = () => {
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

angular.module('lisk_explorer.system').directive('mainHeader', ($socket, $rootScope, header) => {
    return {
        restrict: 'E',
        link: HeaderLink,
        templateUrl: '/shared/header/header.html'
    }
});


