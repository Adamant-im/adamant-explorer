'use strict';

// Setting up routes
angular.module('lisk_explorer').config(function ($stateProvider, $urlRouterProvider) {
    console.log($stateProvider);
    $stateProvider.
    state('home', {
        templateUrl: '/views/index.html',
        url: '/',
        title: 'Home',
        parent: 'Home',
        controller: "IndexController",
        controllerAs: "vm"
    }).
    state('blocks', {
        templateUrl: '/views/blocks.html',
        url: '/blocks/:page?', 
        title: 'Blocks',
        parent: 'Home',
        controller: "BlocksController",
        controllerAs: "vm"
    }).
    state('block', {
        templateUrl: '/views/block.html',
        url: '/block/:blockId',
        title: 'Block ',
        parent: 'Blocks',
        controller: "BlocksController",
        controllerAs: "vm"
    }).
    state('transaction', {
        templateUrl: '/views/transaction.html',
        url: '/tx/:txId',
        title: 'Transaction ',
        parent: 'Home',
        controller: "TransactionsController",
        controllerAs: "vm"
    }).
    state('address', {
        templateUrl: '/views/address.html',
        url: '/address/:address',
        title: 'Address',
        parent: 'Home',
        controller: "AddressController",
        controllerAs: "vm"
    })
    .state('activity-graph', {
        templateUrl : '/views/activityGraph.html',
        url: '/activityGraph',
        title: 'Activity Graph',
        parent: 'Home',
        controller: "ActivityGraph",
        controllerAs: "vm"
    })
    .state('top-accounts', {
        templateUrl : '/views/topAccounts.html',
        url: '/topAccounts',
        title: 'Top Accounts',
        parent: 'Home',
        controller: "TopAccounts",
        controllerAs: "vm"
    })
    .state('delegate-monitor', {
        templateUrl : '/views/delegateMonitor.html',
        url: '/delegateMonitor',
        title: 'Delegate Monitor',
        parent: 'Home',
        controller: "DelegateMonitor",
        controllerAs: "vm"
    })
    .state('market-watcher', {
        templateUrl : '/views/marketWatcher.html',
        url: '/marketWatcher',
        title: 'Market Watcher',
        parent: 'Home',
        controller: "MarketWatcher",
        controllerAs: "vm"
    })
    .state('network-monitor', {
        templateUrl : '/views/networkMonitor.html',
        url: '/networkMonitor',
        title: 'Network Monitor',
        parent: 'Home',
        controller: "NetworkMonitor",
        controllerAs: "vm"
    })
    .state('delegate', {
        templateUrl: '/views/delegate.html',
        url: '/delegate/:delegateId',
        title: 'Delegate',
        parent: 'Home',
        controller: "DelegateController",
        controllerAs: "vm"
    })
    .state('error', {
        url: '404',
        templateUrl: '/views/404.html',
        title: 'Error',
        parent: 'Home'
    });
    $urlRouterProvider.otherwise('/404');
});

// Setting HTML5 location mode
angular.module('lisk_explorer')
//   .config(function ($locationProvider) {
//       $locationProvider.html5Mode(true);
//       $locationProvider.hashPrefix('!');
//   })
  .run(function ($rootScope, $state, $location, $stateParams, $anchorScroll, $http, ngProgress, gettextCatalog) {
      gettextCatalog.currentLanguage = 'en';
      $rootScope.$on('$stateChangeStart', function () {
          console.log('in run stateChangeStart');
          ngProgress.start();
      });

      $rootScope.$on('$stateChangeSuccess', function () {
          console.log('in run stateChangeSuccess');
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
