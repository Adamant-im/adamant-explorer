'use strict';

// Setting up routes
angular.module('lisk_explorer').config(function ($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: '/views/index.html',
        title: 'Home',
        parent: 'Home'
    }).
    when('/blocks/:page?', {
        templateUrl: '/views/blocks.html',
        title: 'Blocks',
        parent: 'Home'
    }).
    when('/block/:blockId', {
        templateUrl: '/views/block.html',
        title: 'Block ',
        parent: 'Blocks'
    }).
    when('/tx/:txId', {
        templateUrl: '/views/transaction.html',
        title: 'Transaction ',
        parent: 'Home'
    }).
    when('/address/:address', {
        templateUrl: '/views/address.html',
        title: 'Address',
        parent: 'Home'
    })
    .when('/activityGraph', {
        templateUrl : '/views/activityGraph.html',
        title: 'Activity Graph',
        parent: 'Home'
    })
    .when('/topAccounts', {
        templateUrl : '/views/topAccounts.html',
        title: 'Top Accounts',
        parent: 'Home'
    })
    .when('/delegateMonitor', {
        templateUrl : '/views/delegateMonitor.html',
        title: 'Delegate Monitor',
        parent: 'Home'
    })
    .when('/marketWatcher', {
        templateUrl : '/views/marketWatcher.html',
        title: 'Market Watcher',
        parent: 'Home'
    })
    .when('/networkMonitor', {
        templateUrl : '/views/networkMonitor.html',
        title: 'Network Monitor',
        parent: 'Home'
    })
    .when('/delegate/:delegateId', {
        templateUrl: '/views/delegate.html',
        title: 'Delegate',
        parent: 'Home'
    })
    .otherwise({
        templateUrl: '/views/404.html',
        title: 'Error',
        parent: 'Home'
    });
});

// Setting HTML5 location mode
angular.module('lisk_explorer')
  .config(function ($locationProvider) {
      $locationProvider.html5Mode(true);
      $locationProvider.hashPrefix('!');
  })
  .run(function ($rootScope, $route, $location, $routeParams, $anchorScroll, $http, ngProgress, gettextCatalog) {
      gettextCatalog.currentLanguage = 'en';
      $rootScope.$on('$routeChangeStart', function () {
          ngProgress.start();
      });

      $rootScope.$on('$routeChangeSuccess', function () {
          ngProgress.complete();

          // Change page title, based on route information
          $rootScope.titleDetail = '';
          $rootScope.title = $route.current.title;
          $rootScope.isCollapsed = true;

          // Market Watcher
          $http.get('/api/exchanges').then (function (result) {
              if (result.data.success && result.data.enabled) {
                $rootScope.marketWatcher = true;
              }
          });

          $location.hash($routeParams.scrollTo);
          $anchorScroll();
      });
  });
