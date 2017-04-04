angular.module('lisk_explorer')
.filter('lisk', () => amount => {
    if (isNaN(amount)) {
        return (0).toFixed(8);
    } else {
        return (parseInt(amount) / 1e8).toFixed (8).replace (/\.?0+$/, '');
    }
});