angular.module('lisk_explorer')
.filter('votes', () => a => a.username || (a.knowledge && a.knowledge.owner) || a.address)