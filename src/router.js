import { createRouter, createWebHistory } from 'vue-router';

/**
 * Application routes.
 *
 * Paths are kept byte-for-byte compatible with the AngularJS explorer so
 * existing links (bookmarks, messenger deep links, search engines) keep
 * working. Every route carries `meta.title` for the document title and
 * `meta.parent` for breadcrumb hierarchy (see `BreadCrumbs.vue`).
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
    meta: { title: 'Blocks', parent: 'home' },
  },
  {
    path: '/block/:blockId',
    name: 'block',
    component: () => import('./views/BlockView.vue'),
    meta: { title: 'Block', parent: 'blocks' },
  },
  {
    path: '/tx/:txId',
    name: 'transaction',
    component: () => import('./views/TransactionView.vue'),
    meta: { title: 'Transaction', parent: 'home' },
  },
  {
    path: '/address/:address',
    name: 'address',
    component: () => import('./views/AddressView.vue'),
    meta: { title: 'Address', parent: 'home' },
  },
  {
    path: '/delegate/:delegateId',
    name: 'delegate',
    component: () => import('./views/DelegateView.vue'),
    meta: { title: 'Delegate', parent: 'address' },
  },
  {
    path: '/topAccounts',
    name: 'top-accounts',
    component: () => import('./views/TopAccountsView.vue'),
    meta: { title: 'Top Accounts', parent: 'home' },
  },
  {
    path: '/reservedWallets',
    name: 'reserved-wallets',
    component: () => import('./views/ReservedWalletsView.vue'),
    meta: { title: 'Reserved Wallets', parent: 'home' },
  },
  {
    path: '/activityGraph',
    name: 'activity-graph',
    component: () => import('./views/ActivityGraphView.vue'),
    meta: { title: 'Activity Graph', parent: 'home' },
  },
  {
    path: '/delegateMonitor',
    name: 'delegate-monitor',
    component: () => import('./views/DelegateMonitorView.vue'),
    meta: { title: 'Delegate Monitor', parent: 'home' },
  },
  {
    path: '/networkMonitor',
    name: 'network-monitor',
    component: () => import('./views/NetworkMonitorView.vue'),
    meta: { title: 'Network Monitor', parent: 'home' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('./views/NotFoundView.vue'),
    meta: { title: 'Page Not Found', parent: 'home' },
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
