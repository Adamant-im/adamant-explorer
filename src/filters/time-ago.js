angular.module('lisk_explorer')
.filter('timeAgo', epochStampFilter => timestamp => moment(epochStampFilter(timestamp)).fromNow());