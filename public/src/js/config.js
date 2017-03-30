'use strict';

// Setting up routes
angular.module('lisk_explorer').config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider.
    state('home', {
        templateUrl: '/views/index.html',
        url: '/',
        parentDir: 'home',
        controller: 'HomeCtrl',
        controllerAs: 'vm'
    }).
    state('blocks', {
        templateUrl: '/views/blocks.html',
        url: '/blocks/:page',
        parentDir: 'home',
        controller: 'BlocksCtrl',
        controllerAs: 'vm'
    }).
    state('block', {
        templateUrl: '/views/block.html',
        url: '/block/:blockId',
        parentDir: 'blocks',
        controller: 'BlocksCtrl',
        controllerAs: 'vm'
    }).
    state('transaction', {
        templateUrl: '/views/transaction.html',
        url: '/tx/:txId',
        parentDir: 'home',
        controller: 'TransactionsCtrl',
        controllerAs: 'vm'
    }).
    state('address', {
        templateUrl: '/views/address.html',
        url: '/address/:address',
        parentDir: 'home',
        controller: 'AddressCtrl',
        controllerAs: 'vm'
    })
    .state('activity-graph', {
        templateUrl : '/views/activityGraph.html',
        url: '/activityGraph',
        parentDir: 'home',
        controller: 'ActivityGraphCtrl',
        controllerAs: 'vm'
    })
    .state('top-accounts', {
        templateUrl : '/views/topAccounts.html',
        url: '/topAccounts',
        parentDir: 'home',
        controller: 'TopAccountsCtrl',
        controllerAs: 'vm'
    })
    .state('delegate-monitor', {
        templateUrl : '/views/delegateMonitor.html',
        url: '/delegateMonitor',
        parentDir: 'home',
        controller: 'DelegateMonitorCtrl',
        controllerAs: 'vm'
    })
    .state('market-watcher', {
        templateUrl : '/views/marketWatcher.html',
        url: '/marketWatcher',
        parentDir: 'home',
        controller: 'MarketWatcherCtrl',
        controllerAs: 'vm'
    })
    .state('network-monitor', {
        templateUrl : '/views/networkMonitor.html',
        url: '/networkMonitor',
        parentDir: 'home',
        controller: 'NetworkMonitorCtrl',
        controllerAs: 'vm'
    })
    .state('delegate', {
        templateUrl: '/views/delegate.html',
        url: '/delegate/:delegateId',
        parentDir: 'address',
        controller: 'DelegateCtrl',
        controllerAs: 'vm'
    })
    .state('error', {
        url: '404',
        templateUrl: '/views/404.html',
        parentDir: 'home'
    });
    $urlRouterProvider.otherwise('/404');
    $locationProvider.html5Mode(true);

});

// Setting HTML5 location mode
angular.module('lisk_explorer')
  .run(function ($rootScope, $state, $location, $stateParams, $anchorScroll, $http, ngProgress, gettextCatalog) {
      gettextCatalog.currentLanguage = 'en';

      $rootScope.$on('$stateChangeStart', function (a, b) {
          ngProgress.start();
      });

      $rootScope.$on('$stateChangeSuccess', function (a, b) {
          ngProgress.complete();

          // Change page title, based on route information
          $rootScope.titleDetail = '';
          $rootScope.title = $state.current.title;
          $rootScope.isCollapsed = true;

          // Market Watcher
          $http.get('/api/exchanges').then (function (result) {
              if (result.data.success && result.data.enabled) {
                $rootScope.marketWatcher = true;
              }
          });

          $location.hash($stateParams.scrollTo);
          $anchorScroll();
      });
  });
