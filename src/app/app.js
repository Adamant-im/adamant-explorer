import 'angular';
import 'angular-ui-router';
import 'angular-resource';
import 'angular-animate';
import 'angular-bootstrap';
import 'angular-gettext';
// import 'babel-polyfill';

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

import '../../node_modules/amstock3/amcharts/style.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.css';
import '../../node_modules/font-awesome/css/font-awesome.css';
import '../../node_modules/leaflet/dist/leaflet.css';
import '../../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css';
import '../assets/styles/common.css';
import '../assets/styles/flags.css';
import '../assets/styles/tableMobile.css';

const App = angular.module('lisk_explorer',[
    'ngAnimate',
    'ngResource',
    'ui.router',
    'ui.bootstrap',
    'gettext',
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
