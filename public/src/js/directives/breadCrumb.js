'use strict';

/**
 * Looks in state/route config for title and parent values and creates an array of their heirarchy.
 * in case of parameters, uses $rootScope.breadCrub object (if exists) to replace with their values
 */
angular.module('lisk_explorer')
    .directive('breadCrumb', ['$route', function ($route) {
        return {
            restric: 'E',
            templateUrl: '/views/index/breadCrumb.html',
            link: function (scope, element, attrs) {
                scope.init = function (e, next) {
                    scope.sections = [];

                    var section = next.$$route;

                    while (section.parent !== section.title) {
                        for (route in $route.routes) {
                            if ($route.routes.hasOwnProperty(route) && $route.routes[route].title === section.parent) {
                                scope.sections.unshift({
                                    title: $route.routes[route].title,
                                    url: scope.setPathParams($route.routes[route].originalPath, scope.breadCrumb)
                                });
                                section = $route.routes[route];
                                break;
                            }
                        }
                    }

                    scope.sections.push({
                        title: next.$$route.title,
                        url: '#'
                    });
                }

                /**
                 * Replaces any :param in path string with their corresponding values from given set of breadCrumb values
                 */
                scope.setPathParams = function (path, breadCrumbValues) {
                    var paramsReg = /(?:\/\:([^\/]+)?)/g;
                    var params = path.match(paramsReg);
                    var paramName = '';
                    var paramValue = '';

                    if (params) {
                        for (var i = 0; i < params.length; i++) {
                            paramName = params[i].replace(/(^\/\:)|(\?)/g, '');
                            paramValue = paramName ? breadCrumbValues[paramName]: '';
                            path = path.replace(params[i], '/' + paramValue)
                        }
                    }

                    return path;
                }

                // scope.$on('$routeChangeStart', scope.init);
                scope.$on('$routeChangeSuccess', scope.init);
            }
        };
    }
]);
