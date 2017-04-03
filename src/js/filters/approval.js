angular.module('lisk_explorer')
.filter('approval', () => votes => {
    if (isNaN(votes)) {
        return 0;
    } else {
        // (votes / 1e16) * 100
        return (parseInt(votes) / 1e14).toFixed(2);
    }
});