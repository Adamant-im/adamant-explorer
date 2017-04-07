const FooterLink = () => {};

angular.module('lisk_explorer.system').directive('mainFooter', () => {
    return {
        restrict: 'E',
        link: FooterLink,
        templateUrl: '/shared/footer/footer.html'
    }
});
