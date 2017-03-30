'use strict';

// Setting up routes
angular.module('lisk_explorer').config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $stateProvider.
    state('home', {
        templateUrl: '/views/index.html',
        url: '/',
        // title: 'Home',
        // parentDir: 'Home',
        controller: "HomeCtrl",
        controllerAs: "vm"
    }).
    state('blocks', {
        templateUrl: '/views/blocks.html',
        url: '/blocks/:page', 
        // title: 'Blocks',
        // parentDir: 'Home',
        controller: "BlocksCtrl",
        controllerAs: "vm"
    }).
    state('block', {
        templateUrl: '/views/block.html',
        url: '/block/:blockId',
        // title: 'Block ',
        // parentDir: 'Blocks',
        controller: "BlocksCtrl",
        controllerAs: "vm"
    }).
    state('transaction', {
        templateUrl: '/views/transaction.html',
        url: '/tx/:txId',
        // title: 'Transaction ',
        // parentDir: 'Home',
        controller: "TransactionsCtrl",
        controllerAs: "vm"
    }).
    state('address', {
        templateUrl: '/views/address.html',
        url: '/address/:address',
        // title: 'Address',
        // parentDir: 'Home',
        controller: "AddressCtrl",
        controllerAs: "vm"
    })
    .state('activity-graph', {
        templateUrl : '/views/activityGraph.html',
        url: '/activityGraph',
        // title: 'Activity Graph',
        // parentDir: 'Home',
        controller: "ActivityGraphCtrl",
        controllerAs: "vm"
    })
    .state('top-accounts', {
        templateUrl : '/views/topAccounts.html',
        url: '/topAccounts',
        // title: 'Top Accounts',
        // parentDir: 'Home',
        controller: "TopAccountsCtrl",
        controllerAs: "vm"
    })
    .state('delegate-monitor', {
        templateUrl : '/views/delegateMonitor.html',
        url: '/delegateMonitor',
        // title: 'Delegate Monitor',
        // parentDir: 'Home',
        controller: "DelegateMonitorCtrl",
        controllerAs: "vm"
    })
    .state('market-watcher', {
        templateUrl : '/views/marketWatcher.html',
        url: '/marketWatcher',
        // title: 'Market Watcher',
        // parentDir: 'Home',
        controller: "MarketWatcherCtrl",
        controllerAs: "vm"
    })
    .state('network-monitor', {
        templateUrl : '/views/networkMonitor.html',
        url: '/networkMonitor',
        // title: 'Network Monitor',
        // parentDir: 'Home',
        controller: "NetworkMonitorCtrl",
        controllerAs: "vm"
    })
    .state('delegate', {
        templateUrl: '/views/delegate.html',
        url: '/delegate/:delegateId',
        // title: 'Delegate',
        // parentDir: 'Home',
        controller: "DelegateCtrl",
        controllerAs: "vm"
    })
    .state('error', {
        url: '404',
        templateUrl: '/views/404.html',
        // title: 'Error',
        // parentDir: 'Home'
    });
    $urlRouterProvider.otherwise('/404');
    $locationProvider.html5Mode(true);
    
});

// Setting HTML5 location mode
angular.module('lisk_explorer')
  .run(function ($rootScope, $state, $location, $stateParams, $anchorScroll, $http, ngProgress, gettextCatalog) {
      gettextCatalog.currentLanguage = 'en';
      $rootScope.$on('$stateChangeStart', function (a,b) {
          ngProgress.start();
      });

      $rootScope.$on('$stateChangeSuccess', function (a,b) {
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
