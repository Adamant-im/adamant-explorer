<script setup>
// Root layout: fixed header, routed page content, footer.
// The network store is initialized here so the header status and
// currency tickers are available on every page.
import { useNetworkStore } from './stores/network';
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';

useNetworkStore().init();
</script>

<template>
  <div class="page">
    <AppHeader />
    <main class="container">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>
