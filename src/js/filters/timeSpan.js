angular.module('lisk_explorer')
.filter('timeSpan', epochStampFilter => (a, b) => moment.duration(epochStampFilter(a) - epochStampFilter(b)).humanize());