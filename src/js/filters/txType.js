angular.module('lisk_explorer')
.filter('txType', txTypes => tx => txTypes[parseInt(tx.type)]);