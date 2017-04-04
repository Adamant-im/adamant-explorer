angular.module('lisk_explorer')
.filter('round', () => height => {
    if (isNaN(height)) {
        return 0;
    } else {
        return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0);
    }
});