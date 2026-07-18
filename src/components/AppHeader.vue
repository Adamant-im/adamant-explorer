<script setup>
// Site header: compact navigation plus a separate live network rail.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { IconChevronDown, IconMenu2, IconNetwork, IconX } from '@tabler/icons-vue';
import { useNetworkStore } from '../stores/network';
import { toAdm, nethashLabel } from '../lib/format';
import { networkHealthStatus } from '../lib/networkHealth';
import SearchBox from './SearchBox.vue';
import ThemeToggle from './ThemeToggle.vue';
import logoUrl from '../assets/img/adm-exp-logo-light-256x256.png';

const network = useNetworkStore();
const menuOpen = ref(false);
const toolsOpen = ref(false);
const clock = ref(Date.now());
const blockPulse = ref(false);
let clockTimer;
let pulseTimer;

onMounted(() => {
  clockTimer = window.setInterval(() => {
    clock.value = Date.now();
  }, 1000);
});

onBeforeUnmount(() => {
  window.clearInterval(clockTimer);
  window.clearTimeout(pulseTimer);
});

/** Closes the mobile menu after a navigation so it does not cover content. */
function closeMenus() {
  menuOpen.value = false;
  toolsOpen.value = false;
}

/** Formats the total supply as a grouped integer ADM amount. */
function formatSupply(supply) {
  return Math.round(Number(toAdm(supply))).toLocaleString('en-US');
}

const secondsSinceUpdate = computed(() => {
  if (!network.lastUpdate) {
    return null;
  }

  return Math.max(0, Math.floor((clock.value - network.lastUpdate) / 1000));
});

const networkHealth = computed(() => {
  return networkHealthStatus({
    hasStatus: Boolean(network.blockStatus),
    secondsSinceUpdate: secondsSinceUpdate.value,
    forgingDelegates: network.forgingDelegates,
  });
});

const networkHealthTitle = computed(() =>
  network.forgingDelegates === null
    ? networkHealth.value.label
    : `${networkHealth.value.label}: ${network.forgingDelegates} of 101 active delegates are forging or have only recent misses`,
);

watch(
  () => network.latestBlock,
  (block, previousBlock) => {
    if (!block || block.height === previousBlock?.height) {
      return;
    }

    blockPulse.value = true;
    window.clearTimeout(pulseTimer);
    pulseTimer = window.setTimeout(() => {
      blockPulse.value = false;
    }, 1000);
  },
);
</script>

<template>
  <header class="site-header">
    <div class="site-header-main">
      <div class="container site-header-inner">
        <router-link
          v-tooltip="'ADAMANT Blockchain Explorer'"
          to="/"
          class="brand"
          @click="closeMenus"
        >
          <img :src="logoUrl" alt="ADAMANT Blockchain Explorer" class="brand-logo" />
          <span>Explorer</span>
        </router-link>

        <button
          type="button"
          class="menu-toggle"
          aria-label="Toggle navigation"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <IconX v-if="menuOpen" aria-hidden="true" />
          <IconMenu2 v-else aria-hidden="true" />
        </button>

        <div class="site-nav" :class="{ open: menuOpen }">
          <SearchBox class="header-search" @found="closeMenus" />

          <nav class="nav-links">
            <router-link to="/blocks" @click="closeMenus">Blocks</router-link>
            <div class="dropdown" :class="{ open: toolsOpen }">
              <button
                type="button"
                class="dropdown-toggle"
                :aria-expanded="toolsOpen"
                @click="toolsOpen = !toolsOpen"
              >
                Monitors <IconChevronDown aria-hidden="true" />
              </button>
              <div class="dropdown-menu" @click="closeMenus">
                <router-link to="/activityGraph">Activity Graph</router-link>
                <router-link to="/delegateMonitor">Delegate Monitor</router-link>
                <router-link to="/reservedWallets">Reserved Wallets</router-link>
                <router-link to="/topAccounts">Top Accounts</router-link>
              </div>
            </div>
            <router-link to="/networkMonitor" @click="closeMenus">Network</router-link>
            <span class="nav-divider" aria-hidden="true"></span>
            <span v-tooltip="'Display currency'" class="currency-badge">ADM</span>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </div>

    <div class="network-rail">
      <div class="container network-rail-inner">
        <div
          v-tooltip="{ content: networkHealthTitle, tone: networkHealth.tone }"
          class="network-health"
          :class="networkHealth.tone"
        >
          <i class="network-status-dot" :class="{ pulse: blockPulse }" aria-hidden="true"></i>
          <span>{{ networkHealth.label }}</span>
        </div>

        <template v-if="network.blockStatus">
          <div class="rail-stat">
            <span>Height</span>
            <strong>{{ Number(network.blockStatus.height).toLocaleString('en-US') }}</strong>
          </div>
          <div class="rail-stat">
            <span>Supply</span>
            <strong>{{ formatSupply(network.blockStatus.supply) }} ADM</strong>
          </div>
          <div class="rail-stat">
            <IconNetwork aria-hidden="true" />
            <strong>
              {{
                network.blockStatus.nethash ? nethashLabel(network.blockStatus.nethash) : 'Unknown'
              }}
            </strong>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>
