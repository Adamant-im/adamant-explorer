'use strict';

angular.module('lisk_explorer')
.filter('startFrom', () => (input, start) => {
    start = +start;
    return input.slice(start);
})