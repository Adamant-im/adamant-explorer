'use strict';

angular.module('cryptichain',[
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngProgress',
    'ui.bootstrap',
    'ui.route',
    'gettext',
    'cryptichain.system',
    'cryptichain.socket',
    'cryptichain.blocks',
    'cryptichain.transactions',
    'cryptichain.address',
    'cryptichain.search',
    'cryptichain.activity',
    'cryptichain.network'
]);

angular.module('cryptichain.system', []);
angular.module('cryptichain.socket', []);
angular.module('cryptichain.blocks', []);
angular.module('cryptichain.transactions', []);
angular.module('cryptichain.address', []);
angular.module('cryptichain.search', []);
angular.module('cryptichain.activity', []);
angular.module('cryptichain.network', []);
