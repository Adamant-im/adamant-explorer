'use strict';

angular.module('lisk_explorer')
  .directive('whenScrolled', $window => ({
    restric: 'A',

    link: function (scope, elm, attr) {
        let pageHeight, clientHeight, scrollPos;
        $window = angular.element($window);

        const handler = () => {
            pageHeight = window.document.documentElement.scrollHeight;
            clientHeight = window.document.documentElement.clientHeight;
            scrollPos = window.pageYOffset;

            if (pageHeight - (scrollPos + clientHeight) === 0) {
                scope.$apply(attr.whenScrolled);
            }
        };

        $window.on('scroll', handler);

        scope.$on('$destroy', () => $window.off('scroll', handler));
    }
}));
