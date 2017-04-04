'use strict';

const FooterCtrlConstructor = () => {};

angular.module('lisk_explorer.system').directive('FooterCtrl', () => {
    return {
        restrict: 'E',
        link: FooterCtrlConstructor,
        templateUrl: '/shared/footer/footer.html'
    }
});
