'use strict';

// Global service for global variables
angular.module('cryptichain.system')
  .factory('Global', [ function () { return true; } ])
  .factory('Version',
    function ($resource) {
        return $resource('/api/version');
    });
