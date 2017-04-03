
angular.module('lisk_explorer')
.config(($stateProvider, $urlRouterProvider, $locationProvider) => {
    $stateProvider.
    state('home', {
        templateUrl: '/views/index.html',
        url: '/',
        parentDir: 'home',
        controller: "HomeCtrl",
        controllerAs: "vm"
    }).
    state('blocks', {
        templateUrl: '/views/blocks.html',
        url: '/blocks/:page', 
        parentDir: 'home',
        controller: "BlocksCtrl",
        controllerAs: "vm"
    }).
    state('block', {
        templateUrl: '/views/block.html',
        url: '/block/:blockId',
        parentDir: 'blocks',
        controller: "BlocksCtrl",
        controllerAs: "vm"
    }).
    state('transaction', {
        templateUrl: '/views/transaction.html',
        url: '/tx/:txId',
        parentDir: 'home',
        controller: "TransactionsCtrl",
        controllerAs: "vm"
    }).
    state('address', {
        templateUrl: '/views/address.html',
        url: '/address/:address',
        parentDir: 'home',
        controller: "AddressCtrl",
        controllerAs: "vm"
    })
    .state('activity-graph', {
        templateUrl : '/views/activityGraph.html',
        url: '/activityGraph',
        parentDir: 'home',
        controller: "ActivityGraphCtrl",
        controllerAs: "vm"
    })
    .state('top-accounts', {
        templateUrl : '/views/topAccounts.html',
        url: '/topAccounts',
        parentDir: 'home',
        controller: "TopAccountsCtrl",
        controllerAs: "vm"
    })
    .state('delegate-monitor', {
        templateUrl : '/views/delegateMonitor.html',
        url: '/delegateMonitor',
        parentDir: 'home',
        controller: "DelegateMonitorCtrl",
        controllerAs: "vm"
    })
    .state('market-watcher', {
        templateUrl : '/views/marketWatcher.html',
        url: '/marketWatcher',
        parentDir: 'home',
        controller: "MarketWatcherCtrl",
        controllerAs: "vm"
    })
    .state('network-monitor', {
        templateUrl : '/views/networkMonitor.html',
        url: '/networkMonitor',
        parentDir: 'home',
        controller: "NetworkMonitorCtrl",
        controllerAs: "vm"
    })
    .state('delegate', {
        templateUrl: '/views/delegate.html',
        url: '/delegate/:delegateId',
        parentDir: 'address',
        controller: "DelegateCtrl",
        controllerAs: "vm"
    })
    .state('error', {
        url: '404',
        templateUrl: '/views/404.html',
        parentDir: 'home'
    });
    $urlRouterProvider.otherwise('/404');
    $locationProvider.html5Mode(true);
    
});