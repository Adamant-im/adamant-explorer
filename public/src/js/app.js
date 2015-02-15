'use strict';

angular.module('insight',[
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngProgress',
    'ui.bootstrap',
    'ui.route',
    'gettext',
    'insight.system',
    'insight.socket',
    'insight.blocks',
    'insight.transactions',
    'insight.address',
    'insight.search',
    'insight.activity'
]);

angular.module('insight.system', []);
angular.module('insight.socket', []);
angular.module('insight.blocks', []);
angular.module('insight.transactions', []);
angular.module('insight.address', []);
angular.module('insight.search', []);
angular.module('insight.activity', []);
