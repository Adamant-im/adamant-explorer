import 'angular';
import 'angular-ui-router';
import 'angular-resource';
import 'angular-animate';
import 'angular-ui-bootstrap';
import 'angular-gettext';
import 'angular-advanced-searchbox'
// import 'babel-polyfill';

// styles
import 'amstock3/amcharts/style.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'angular-advanced-searchbox/dist/angular-advanced-searchbox.min.css'
import '../assets/styles/common.css';
import '../assets/styles/flags.css';
import '../assets/styles/tableMobile.css';

// submodules
import '../components/blocks';
import '../components/address';
import '../components/transactions';
import '../components/delegate';
import '../components/delegate-monitor';
import '../components/top-accounts';
import '../components/search';
import '../components/header';
import '../components/footer';
import '../components/currency-selector';
import '../components/activity-graph';
import '../components/home';
import '../components/bread-crumb';
import '../components/market-watcher';
import '../components/network-monitor';

import '../filters';
import '../services';
import '../directives';
import './app-tools.module.js';
import '../shared';

const App = angular.module('lisk_explorer',[
    'ngAnimate',
    'ngResource',
    'ui.router',
    'ui.bootstrap',
    'gettext',
    'angular-advanced-searchbox',
    'lisk_explorer.breadCrumb',
    'lisk_explorer.filters',
    'lisk_explorer.services',
    'lisk_explorer.header',
    'lisk_explorer.footer',
    'lisk_explorer.blocks',
    'lisk_explorer.transactions',
    'lisk_explorer.address',
    'lisk_explorer.delegate',
    'lisk_explorer.topAccounts',
    'lisk_explorer.search',
    'lisk_explorer.tools',
    'lisk_explorer.currency',
    'lisk_explorer.activityGraph',
    'lisk_explorer.delegateMonitor',
    'lisk_explorer.home',
    'lisk_explorer.networkMonitor',
    'lisk_explorer.marketWatcher'
]);

export default App;
