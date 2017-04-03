angular.module('lisk_explorer')
.filter('epochStamp', () => d => new Date(
    (((Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000) + d) * 1000)
));