
angular.module('lisk_explorer')
.config(($stateProvider, $urlRouterProvider, $locationProvider) => {
    $stateProvider.
    state('home', {
        templateUrl: '/components/home/home.html',
        url: '/',
        parentDir: 'home',
        controller: 'HomeCtrl',
        controllerAs: 'vm'
    }).
    state('blocks', {
        templateUrl: '/components/blocks/blocks.html',
        url: '/blocks/:page', 
        parentDir: 'home',
        controller: 'BlocksCtrl',
        controllerAs: 'vm'
    }).
    state('block', {
        templateUrl: '/components/block/block.html',
        url: '/block/:blockId',
        parentDir: 'blocks',
        controller: 'BlockCtrl',
        controllerAs: 'vm'
    }).
    state('transaction', {
        templateUrl: '/components/transactions/transaction.html',
        url: '/tx/:txId',
        parentDir: 'home',
        controller: 'TransactionsCtrl',
        controllerAs: 'vm'
    }).
    state('address', {
        templateUrl: '/components/address/address.html',
        url: '/address/:address',
        parentDir: 'home',
        controller: 'AddressCtrl',
        controllerAs: 'vm'
    })
    .state('activity-graph', {
        templateUrl : '/components/activity-graph/activity-graph.html',
        url: '/activityGraph',
        parentDir: 'home',
        controller: 'ActivityGraphCtrl',
        controllerAs: 'vm'
    })
    .state('top-accounts', {
        templateUrl : '/components/top-accounts/top-accounts.html',
        url: '/topAccounts',
        parentDir: 'home',
        controller: 'TopAccountsCtrl',
        controllerAs: 'vm'
    })
    .state('delegate-monitor', {
        templateUrl : '/components/delegate-monitor/delegate-monitor.html',
        url: '/delegateMonitor',
        parentDir: 'home',
        controller: 'DelegateMonitorCtrl',
        controllerAs: 'vm'
    })
    .state('market-watcher', {
        templateUrl : '/components/market-watcher/market-watcher.html',
        url: '/marketWatcher',
        parentDir: 'home',
        controller: 'MarketWatcherCtrl',
        controllerAs: 'vm'
    })
    .state('network-monitor', {
        templateUrl : '/components/network-monitor/network-monitor.html',
        url: '/networkMonitor',
        parentDir: 'home',
        controller: 'NetworkMonitorCtrl',
        controllerAs: 'vm'
    })
    .state('delegate', {
        templateUrl: '/components/delegate/delegate.html',
        url: '/delegate/:delegateId',
        parentDir: 'address',
        controller: 'DelegateCtrl',
        controllerAs: 'vm'
    })
    .state('error', {
        url: '404',
        templateUrl: '/components/404/404.html',
        parentDir: 'home'
    });
    $urlRouterProvider.otherwise('/404');
    $locationProvider.html5Mode(true);
    
});