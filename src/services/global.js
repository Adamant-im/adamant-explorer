'use strict';

// Global service for global variables
angular.module('lisk_explorer.system')
  // @todo what's this?
  .factory('Global', [ () => true ])
  .factory('Version',
    $resource => $resource('/api/version'));
