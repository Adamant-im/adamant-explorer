import AppServices from './services.module';

// Global service for global variables
AppServices
  // @todo what's this?
  .factory('Global', [ () => true ])
  .factory('Version',
    $resource => $resource('/api/version'));
