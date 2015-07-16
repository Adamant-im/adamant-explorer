'use strict';

angular.module('cryptichain',[
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngProgress',
    'ui.bootstrap',
    'gettext',
    'cryptichain.system',
    'cryptichain.socket',
    'cryptichain.blocks',
    'cryptichain.transactions',
    'cryptichain.address',
    'cryptichain.search',
    'cryptichain.tools'
]);

angular.module('cryptichain.system', []);
angular.module('cryptichain.socket', []);
angular.module('cryptichain.blocks', []);
angular.module('cryptichain.transactions', []);
angular.module('cryptichain.address', []);
angular.module('cryptichain.search', []);
angular.module('cryptichain.tools', []);
