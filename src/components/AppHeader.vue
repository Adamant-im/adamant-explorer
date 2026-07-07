<script setup>
// Site header: brand logo, search, live network status from the
// `/header` socket (via the network store), and the tools menu.
import { ref } from 'vue';
import { useNetworkStore } from '../stores/network';
import { toAdm, nethashLabel } from '../lib/format';
import SearchBox from './SearchBox.vue';
import logoUrl from '../assets/img/adm-exp-logo-light-256x256.png';

const network = useNetworkStore();
const menuOpen = ref(false);
const toolsOpen = ref(false);

/** Closes the mobile menu after a navigation so it does not cover content. */
function closeMenus() {
  menuOpen.value = false;
  toolsOpen.value = false;
}

/** Formats the total supply as a grouped integer ADM amount. */
function formatSupply(supply) {
  return Math.round(Number(toAdm(supply))).toLocaleString('en-US');
}
</script>

<template>
  <header class="site-header">
    <div class="container site-header-inner">
      <router-link to="/" class="brand" title="ADAMANT Blockchain Explorer" @click="closeMenus">
        <img :src="logoUrl" alt="ADAMANT Blockchain Explorer" class="brand-logo" />
      </router-link>

      <button
        type="button"
        class="menu-toggle"
        aria-label="Toggle navigation"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span></span><span></span><span></span>
      </button>

      <div class="site-nav" :class="{ open: menuOpen }">
        <SearchBox class="header-search" @found="closeMenus" />

        <div v-if="network.blockStatus" class="network-status">
          <span><strong>Height:</strong> {{ network.blockStatus.height }}</span>
          <span><strong>Supply:</strong> {{ formatSupply(network.blockStatus.supply) }}</span>
          <span><strong>Network:</strong> {{ nethashLabel(network.blockStatus.nethash) }}</span>
        </div>

        <nav class="nav-links">
          <router-link to="/blocks" @click="closeMenus">All Blocks</router-link>
          <span class="currency-badge" title="Display currency">ADM</span>
          <div class="dropdown" :class="{ open: toolsOpen }">
            <button type="button" class="dropdown-toggle" @click="toolsOpen = !toolsOpen">
              Tools <span class="caret"></span>
            </button>
            <div class="dropdown-menu" @click="closeMenus">
              <router-link to="/activityGraph">Activity Graph</router-link>
              <router-link to="/delegateMonitor">Delegate Monitor</router-link>
              <router-link to="/networkMonitor">Network Monitor</router-link>
              <router-link to="/reservedWallets">Reserved Wallets</router-link>
              <router-link to="/topAccounts">Top Accounts</router-link>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>
