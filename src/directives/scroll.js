import AppTools from '../app/app-tools.module.js';

AppTools.directive('scroll', $window => (scope, element, attrs) => {
    angular.element($window).bind('scroll', function () {
        if (this.pageYOffset >= 200) {
            scope.secondaryNavbar = true;
        } else {
            scope.secondaryNavbar = false;
        }
        scope.$apply();
    });
});
