'use strict';

/**
 * Looks in state/route config for title and parent values and creates an array of their heirarchy.
 * In case of parameters, uses $rootScope.breadCrumb object (if exists) to replace with their values.
 */
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
                            if (states[i].name === section.parentDir) {
                                scope.sections.unshift({
                                    name: states[i].name,
                                    url: scope.setPathParams(states[i].url, scope.breadCrumb)
                                });
                                section = states[i];
                                break;
                            }
                        };
                    }

                    scope.sections.push({
                        name: next.name,
                        url: '#'
                    });
                };

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
                            paramName = params[i].replace(/(^\/\:)|(\?)/g, '');
                            paramValue = paramName ? breadCrumbValues[paramName]: '';
                            path = path.replace(params[i], '/' + paramValue)
                        }
                    }

                    return path;
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
                            paramName = params[i].replace(/(^\/\:)|(\?)/g, '');
                            paramValue = paramName && breadCrumbValues ? breadCrumbValues[paramName]: '';
                            path = path.replace(params[i], '/' + paramValue)
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
