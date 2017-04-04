'use strict';

angular.module('lisk_explorer')
    .directive('breadCrumb', ['$state', $state => ({
    restric: 'E',
    templateUrl: '/shared/bread-crumb/bread-crumb.html',

    link: function (scope, element, attrs) {
        const states = $state.get();

        scope.init = (e, next) => {
            scope.sections = [];

            let section = next;
            while (section.parentDir !== section.name) {
                for (let item of states) {
                    if (item.name === section.parentDir) {
                        scope.sections.unshift({
                            name: item.name,
                            url: scope.setPathParams(item.url, scope.breadCrumb)
                        });
                        section = item;
                        break;
                    }
                }
            }
            scope.sections.push({
                name: next.name,
                url: '#'
            });
        }

        /**
         * Replaces any :param in path string with their corresponding values from given set of breadCrumb values.
         */
        scope.setPathParams = (path, breadCrumbValues) => {
            const paramsReg = /(?:\/\:([^\/]+)?)/g;
            const params = path.match(paramsReg);
            let paramName = '';
            let paramValue = '';

            if (params) {
                for (let item of params) {
                    paramName = item.replace(/(^\/\:)|(\?)/g, '');
                    paramValue = paramName && breadCrumbValues && breadCrumbValues[paramName] ? breadCrumbValues[paramName]: '';
                    path = path.replace(item, `/${paramValue}`)
                }
            }

            return path;
        }

        // // scope.$on('$stateChangeStart', scope.init);
        scope.$on('$stateChangeSuccess', scope.init);
    }
})
]);
