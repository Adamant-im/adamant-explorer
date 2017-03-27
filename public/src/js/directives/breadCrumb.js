'use strict';

angular.module('lisk_explorer')
    .directive('breadCrumb', ['$route', function ($route) {
        return {
            restric: 'E',
            template: '<ol class="breadcrumb"><li data-ng-repeat="section in sections"><a data-ng-class="{active: !section.url}" href="{{section.url}}">{{section.title}}</a></li></ol>',
            link: function (scope, element, attrs) {

                scope.init = function (e, next) {
                    scope.sections = [];

                    var section = next.$$route;
                    while (section.parent !== section.title) {
                        for (route in $route.routes) {
                            if ($route.routes.hasOwnProperty(route) && $route.routes[route].title === section.parent) {
                                scope.sections.unshift({
                                    title: $route.routes[route].title,
                                    url: $route.routes[route].originalPath
                                });
                                section = $route.routes[route];
                                break;
                            }
                        }
                    }
                    scope.sections.push({
                        title: next.$$route.title
                    });
                }

                scope.$on('$routeChangeStart', scope.init);
            }
        };
    }
]);
