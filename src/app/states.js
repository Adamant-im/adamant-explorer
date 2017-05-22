import 'angular';
import App from './app';

App.config(($stateProvider, $urlRouterProvider, $locationProvider) => {
    $stateProvider.
    state('home', {
        url: '/',
        parentDir: 'home',
        component: 'home',
    }).
    state('blocks', {
        url: '/blocks/:page', 
        parentDir: 'home',
        component: 'blocks',
    }).
    state('block', {
        url: '/block/:blockId',
        parentDir: 'blocks',
        component: 'block',
    }).
    state('transaction', {
        url: '/tx/:txId',
        parentDir: 'home',
        component: 'transactions',
    }).
    state('address', {
        url: '/address/:address',
        parentDir: 'home',
        component: 'address',
    })
    .state('activity-graph', {
        url: '/activityGraph',
        parentDir: 'home',
        component: 'activityGraph',
    })
    .state('top-accounts', {
        url: '/topAccounts',
        parentDir: 'home',
        component: 'topAccounts',
    })
    .state('delegate-monitor', {
        url: '/delegateMonitor',
        parentDir: 'home',
        component: 'delegateMonitor',
    })
    .state('market-watcher', {
        url: '/marketWatcher',
        parentDir: 'home',
        component: 'marketWatcher',
    })
    .state('network-monitor', {
        url: '/networkMonitor',
        parentDir: 'home',
        component: 'networkMonitor',
    })
    .state('delegate', {
        url: '/delegate/:delegateId',
        parentDir: 'address',
        component: 'delegate',
    })
    .state('error', {
        url: '404',
        parentDir: 'home',
        component: 'c404',
    });
    // $urlRouterProvider.otherwise('/404');
    $locationProvider.html5Mode(true);
});