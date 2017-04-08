'use strict';

angular.module('lisk_explorer.tools')
  .directive('peers', orderBy => ({
    restrict: 'E',
    scope: { peers: '=' },
    templateUrl: '/shared/peers/peers.html',
    replace: true,

    link: function (scope, element, attr) {
        scope.table = orderBy('ip');
    }
}))
  .directive('osIcon', () => ({
    restrict: 'A',

    scope: {
        os: '=os',
        brand: '=brand'
    },

    template: '<span></span>',
    replace: true,

    link: function (scope, element, attr) {
        const el = element[0];

        el.alt = el.title = scope.os;
        el.className += (` os-icon os-${scope.brand.name}`);
    }
}));
