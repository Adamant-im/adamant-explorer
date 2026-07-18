import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import { tooltipDirective } from './directives/tooltip.js';
import './assets/styles/main.css';
import './assets/styles/flags.css';

/**
 * Frontend entry point: mounts the Vue application with the router
 * and the Pinia store onto the `#app` element of `index.html`.
 */
const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive('tooltip', tooltipDirective);

app.mount('#app');
