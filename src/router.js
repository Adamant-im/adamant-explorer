import { createRouter, createWebHistory } from 'vue-router';

/**
 * Application routes.
 *
 * Paths are kept byte-for-byte compatible with the AngularJS explorer so
 * existing links (bookmarks, messenger deep links, search engines) keep
 * working. Every route carries `meta.title` for the document title.
 *
 * Views are lazy-loaded so each page becomes its own chunk; the heavy
 * pages (map, graph) do not weigh down the initial bundle.
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/HomeView.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/blocks/:page?',
    name: 'blocks',
    component: () => import('./views/BlocksView.vue'),
    meta: { title: 'Blocks' },
  },
  {
    path: '/block/:blockId',
    name: 'block',
    component: () => import('./views/BlockView.vue'),
    meta: { title: 'Block' },
  },
  {
    path: '/tx/:txId',
    name: 'transaction',
    component: () => import('./views/TransactionView.vue'),
    meta: { title: 'Transaction' },
  },
  {
    path: '/address/:address',
    name: 'address',
    component: () => import('./views/AddressView.vue'),
    meta: { title: 'Address' },
  },
  {
    path: '/delegate/:delegateId',
    name: 'delegate',
    component: () => import('./views/DelegateView.vue'),
    meta: { title: 'Delegate' },
  },
  {
    path: '/topAccounts',
    name: 'top-accounts',
    component: () => import('./views/TopAccountsView.vue'),
    meta: { title: 'Top Accounts' },
  },
  {
    path: '/reservedWallets',
    name: 'reserved-wallets',
    component: () => import('./views/ReservedWalletsView.vue'),
    meta: { title: 'Reserved Wallets' },
  },
  {
    path: '/activityGraph',
    name: 'activity-graph',
    component: () => import('./views/ActivityGraphView.vue'),
    meta: { title: 'Activity Graph' },
  },
  {
    path: '/delegateMonitor',
    name: 'delegate-monitor',
    component: () => import('./views/DelegateMonitorView.vue'),
    meta: { title: 'Delegate Monitor' },
  },
  {
    path: '/networkMonitor',
    name: 'network-monitor',
    component: () => import('./views/NetworkMonitorView.vue'),
    meta: { title: 'Network Monitor' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/NotFoundView.vue'),
    meta: { title: 'Page Not Found' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Restore position on back/forward, start at the top otherwise
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

router.afterEach((to) => {
  const title = to.meta.title ? `${to.meta.title} — ` : '';
  document.title = `${title}ADAMANT Blockchain Explorer`;
});

export default router;
