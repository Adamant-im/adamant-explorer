import AppHeader from './header.module';
import template from './header.html';

/**
 *
 * @todo Fix the service usage
 *
 */
AppHeader.directive('mainHeader', ($socket, $rootScope, Header) => {
    const HeaderLink = () => {
        $rootScope.currency = {
            symbol: 'ADM'
        };

        const header = new Header($rootScope);
        let ns = $socket('/header');

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

    return {
        restrict: 'E',
        replace: true,
        link: HeaderLink,
        template: template
    }
});
