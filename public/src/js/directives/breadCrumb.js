'use strict';

angular.module('lisk_explorer')
    .directive('breadCrumb', ['$state', function ($state) {
        return {
            restric: 'E',
            templateUrl: '/views/index/breadCrumb.html',
            link: function (scope, element, attrs) {
                console.log('breadCrumb');

                scope.init = function (e, next) {
                    console.log('breadCrumb should have $$state ', next);
                    scope.sections = [];

                    var section = next.$$state;
                    while (section.parent !== section.title) {
                        for (state in $state.states) {
                            
                            if ($state.states.hasOwnProperty(state) && $state.states[state].title === section.parent) {
                                scope.sections.unshift({
                                    title: $state.states[state].title,
                                    url: $state.states[state].originalPath.replace(/(?:\/\:([^\/]+)?)\?$/g, '')
                                });
                                section = $state.states[state];
                                break;
                            }
                        }
                    }
                    scope.sections.push({
                        title: next.$$state.title,
                        url: '#'
                    });
                }

                // scope.$on('$stateChangeStart', scope.init);
                scope.$on('$stateChangeSuccess', function () {
                    console.log('sdsddfs');
                    scope.init();
                });
            }
        };
    }
]);
