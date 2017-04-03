'use strict';

angular.module('lisk_explorer')
    .directive('breadCrumb', ['$state', function ($state) {
        return {
            restric: 'E',
            templateUrl: '/views/index/breadCrumb.html',
            link: function (scope, element, attrs) {
                var states = $state.get();

                scope.init = function (e, next) {
                    scope.sections = [];

                    var section = next;
                    while (section.parentDir !== section.name) {
                        for (var i = 0; i < states.length; i++) {
                            var item = states[i];
                            if (item.name === section.parentDir) {
                                scope.sections.unshift({
                                    name: item.name,
                                    url: scope.setPathParams(item.url, scope.breadCrumb)
                                });
                                section = item;
                                break;
                            }
                        };
                    }
                    scope.sections.push({
                        name: next.name,
                        url: '#'
                    });
                }

                /**
                 * Replaces any :param in path string with their corresponding values from given set of breadCrumb values.
                 */
                scope.setPathParams = function (path, breadCrumbValues) {
                    var paramsReg = /(?:\/\:([^\/]+)?)/g;
                    var params = path.match(paramsReg);
                    var paramName = '';
                    var paramValue = '';

                    if (params) {
                        for (var i = 0; i < params.length; i++) {
                            var item = params[i];
                            paramName = item.replace(/(^\/\:)|(\?)/g, '');
                            paramValue = paramName && breadCrumbValues && breadCrumbValues[paramName] ? breadCrumbValues[paramName]: '';
                            path = path.replace(item, '/' + paramValue)
                        }
                    }

                    return path;
                }

                // // scope.$on('$stateChangeStart', scope.init);
                scope.$on('$stateChangeSuccess', scope.init);
            }
        };
    }
]);
