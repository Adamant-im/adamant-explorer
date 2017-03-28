'use strict';

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
                                    url: $route.routes[route].originalPath.replace(/(?:\/\:([^\/]+)?)\?$/g, '')
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

                // scope.$on('$routeChangeStart', scope.init);
                scope.$on('$routeChangeSuccess', scope.init);
            }
        };
    }
]);
