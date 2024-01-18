import 'angular';
import 'angular-ui-router';
import 'angular-resource';
import 'angular-animate';
import 'angular-ui-bootstrap';
import 'angular-gettext';
// import 'angular-advanced-searchbox'
// import 'babel-polyfill';

// styles
import 'amstock3/amcharts/style.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.min.css';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
// import 'angular-advanced-searchbox/dist/angular-advanced-searchbox.min.css'
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
import '../components/reserved-wallets';
import '../components/home';
import '../components/bread-crumb';
import '../components/market-watcher';
import '../components/network-monitor';

import '../filters';
import '../services';
import '../directives';
import './app-tools.module.js';
import '../shared';

const App = angular.module('adamant_explorer',[
    'ngAnimate',
    'ngResource',
    'ui.router',
    'ui.bootstrap',
    'gettext',
    // 'angular-advanced-searchbox',
    'adamant_explorer.breadCrumb',
    'adamant_explorer.filters',
    'adamant_explorer.services',
    'adamant_explorer.header',
    'adamant_explorer.footer',
    'adamant_explorer.blocks',
    'adamant_explorer.transactions',
    'adamant_explorer.address',
    'adamant_explorer.delegate',
    'adamant_explorer.topAccounts',
    'adamant_explorer.search',
    'adamant_explorer.tools',
    'adamant_explorer.currency',
    'adamant_explorer.activityGraph',
    'adamant_explorer.delegateMonitor',
    'adamant_explorer.home',
    'adamant_explorer.reservedWallets',
    'adamant_explorer.networkMonitor',
    'adamant_explorer.marketWatcher'
]);

export default App;
