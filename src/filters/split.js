angular.module('lisk_explorer')
.filter('split', () => (input, delimiter) => {
    delimiter = delimiter || ',';
    return input.split(delimiter);
});