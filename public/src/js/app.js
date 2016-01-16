'use strict';

angular.module('lisk_explorer',[
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngProgress',
    'ui.bootstrap',
    'gettext',
    'lisk_explorer.system',
    'lisk_explorer.socket',
    'lisk_explorer.blocks',
    'lisk_explorer.transactions',
    'lisk_explorer.address',
    'lisk_explorer.search',
    'lisk_explorer.tools'
]);

angular.module('lisk_explorer.system', []);
angular.module('lisk_explorer.socket', []);
angular.module('lisk_explorer.blocks', []);
angular.module('lisk_explorer.transactions', []);
angular.module('lisk_explorer.address', []);
angular.module('lisk_explorer.search', []);
angular.module('lisk_explorer.tools', []);
