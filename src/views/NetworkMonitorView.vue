<script setup>
// Network Monitor: peer statistics and a world map of connected peers,
// fed by the `/networkMonitor` socket namespace.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useNetworkStore } from '../stores/network';
import { useSocket } from '../composables/useSocket';
import { formatCurrency, timeAgo, timeSpan } from '../lib/format';
import { compareVersionsDescending } from '../lib/peers.js';
import TabsBar from '../components/TabsBar.vue';
import PeersTable from '../components/PeersTable.vue';
import OsIcon from '../components/OsIcon.vue';

const network = useNetworkStore();

const peers = ref(null);
const lastBlock = ref(null);
const bestBlock = ref(null);
const volume = ref(null);

const tab = ref('connected');
const tabs = [
  { id: 'connected', label: 'Connected Peers' },
  { id: 'disconnected', label: 'Disconnected Peers' },
];

// --- Leaflet map ------------------------------------------------------

let map = null;
let cluster = null;
/** Marker per connected peer, keyed by peer IP. */
const markers = {};

/** Marker icons per OS brand; unknown platforms share one icon. */
const platformIcons = {};

function createMap() {
  map = L.map('map', { center: L.latLng(40, 0), zoom: 1, minZoom: 1, maxZoom: 10 });
  cluster = L.markerClusterGroup({ maxClusterRadius: 50 });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const PlatformIcon = L.Icon.extend({
    options: { iconSize: [32, 41], iconAnchor: [16, 41], popupAnchor: [0, -41] },
  });

  for (const name of ['darwin', 'linux', 'win', 'freebsd', 'unknown']) {
    platformIcons[name] = new PlatformIcon({ iconUrl: `/leaflet/marker-icon-${name}.png` });
  }
}

/** Escapes text interpolated into Leaflet popup HTML. */
function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );
}

/** Builds the HTML content of a peer's map popup. */
function popupContent(peer) {
  const lines = [`<p class="ip">${escapeHtml(peer.ip)}</p>`];
  const fields = [
    ['Hostname', peer.location.hostname],
    ['Version', peer.version],
    ['OS', peer.os],
    ['City', peer.location.city],
    ['Region', peer.location.region_name],
    ['Country', peer.location.country_name],
  ];

  for (const [label, value] of fields) {
    if (value) {
      lines.push(`<p><span class="label">${label}: </span>${escapeHtml(value)}</p>`);
    }
  }

  return lines.join('');
}

/** Adds markers for newly connected peers and drops disconnected ones. */
function updateMap(list) {
  if (!map) {
    return;
  }

  const connectedIps = [];

  for (const peer of list.connected) {
    const location = peer.location;

    if (
      !location ||
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number'
    ) {
      continue;
    }

    if (!markers[peer.ip]) {
      markers[peer.ip] = L.marker([location.latitude, location.longitude], {
        title: peer.ipString ?? peer.ip,
        icon: platformIcons[peer.osBrand.name] ?? platformIcons.unknown,
      }).bindPopup(popupContent(peer));
      cluster.addLayer(markers[peer.ip]);
    }

    connectedIps.push(peer.ip);
  }

  for (const ip of Object.keys(markers)) {
    if (!connectedIps.includes(ip)) {
      cluster.removeLayer(markers[ip]);
      delete markers[ip];
    }
  }

  map.addLayer(cluster);
}

// --- Counters ---------------------------------------------------------

/** Deduplicates peers reported twice under the same id. */
function dedupe(list) {
  const seen = new Set();

  return list.filter((peer) => {
    if (!peer.id || seen.has(peer.id)) {
      return false;
    }

    seen.add(peer.id);
    return true;
  });
}

const counter = computed(() => {
  if (!peers.value) {
    return null;
  }

  const connected = peers.value.connected;
  const platformCounter = [0, 0, 0, 0];
  const versions = [...new Set(connected.map((p) => p.version))]
    .sort(compareVersionsDescending)
    .slice(0, 3);
  const versionCounter = [0, 0, 0, 0];
  const heights = [...new Set(connected.map((p) => p.height).sort((a, b) => a - b))]
    .reverse()
    .slice(0, 4);
  const heightCounter = [0, 0, 0, 0, 0];

  for (const peer of connected) {
    // Platform groups: 0 other, 1 darwin, 2 linux, 3 freebsd
    if (typeof peer.osBrand?.group === 'number') {
      platformCounter[peer.osBrand.group]++;
    }

    const versionIndex = versions.indexOf(peer.version);
    versionCounter[versionIndex === -1 ? 3 : versionIndex]++;

    const heightIndex = heights.indexOf(peer.height);
    heightCounter[heightIndex === -1 ? 4 : heightIndex]++;
  }

  return {
    connected: connected.length,
    disconnected: peers.value.disconnected.length,
    total: connected.length + peers.value.disconnected.length,
    platforms: platformCounter,
    versions,
    versionCounter,
    heights,
    heightCounter,
    heightPercent: heightCounter.map((count) =>
      connected.length ? Math.round((count / connected.length) * 100) : 0,
    ),
  };
});

// --- Socket wiring ----------------------------------------------------

const socket = useSocket('/networkMonitor');

/** Applies a peers payload to the view state and the map. */
function updatePeers(payload) {
  const list = {
    connected: dedupe(payload.list.connected),
    disconnected: dedupe(payload.list.disconnected),
  };

  peers.value = list;
  updateMap(list);
}

socket.on('data', (res) => {
  if (res.peers) updatePeers(res.peers);
  if (res.lastBlock) lastBlock.value = res.lastBlock.block;
  if (res.blocks) {
    bestBlock.value = res.blocks.best;
    volume.value = res.blocks.volume;
  }
});
// The backend splits periodic updates into three sub-events
socket.on('data1', (res) => {
  if (res.lastBlock) lastBlock.value = res.lastBlock.block;
});
socket.on('data2', (res) => {
  if (res.blocks) {
    bestBlock.value = res.blocks.best;
    volume.value = res.blocks.volume;
  }
});
socket.on('data3', (res) => {
  if (res.peers) updatePeers(res.peers);
});

onMounted(() => {
  createMap();

  // Peers may have arrived before the map container mounted
  if (peers.value) {
    updateMap(peers.value);
  }
});

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

/** Formats a sats value with the page's currency settings. */
function amount(value) {
  return formatCurrency(value || 0, network.currency, network.decimalPlaces);
}
</script>

<template>
  <section>
    <h1>Network Monitor</h1>
    <hr />

    <div class="network-layout">
      <div class="cards-grid two-columns">
        <div class="big-info">
          <p class="small-title">Connected Peers</p>
          <p class="big-details">
            <span class="accent">{{ counter?.connected || 0 }}</span>
            <span class="text-muted"> / </span>
            <span class="accent">{{ counter?.total || 0 }}</span>
          </p>
          <p class="text-muted">{{ counter?.disconnected || 0 }} disconnected peers</p>
        </div>

        <div class="big-info">
          <p class="small-title">Last Block</p>
          <template v-if="lastBlock">
            <p class="big-details">
              <router-link :to="`/block/${lastBlock.id}`">{{ lastBlock.id }}</router-link>
            </p>
            <p class="text-muted">
              <span class="accent">
                {{ amount(lastBlock.totalAmount + lastBlock.totalFee) }}
                {{ network.currency.symbol }}
              </span>
              from {{ lastBlock.numberOfTransactions || 0 }} transactions
            </p>
            <p class="text-muted">{{ timeAgo(lastBlock.timestamp) }}</p>
          </template>
          <template v-else>
            <p class="big-details"><span class="text-muted">N/A</span></p>
            <p class="text-muted">waiting for block <span class="spinner"></span></p>
          </template>
        </div>

        <div class="big-info">
          <p class="small-title">Best Block</p>
          <template v-if="bestBlock">
            <p class="big-details">
              <router-link :to="`/block/${bestBlock.id}`">{{ bestBlock.id }}</router-link>
            </p>
            <p class="text-muted">
              <span class="accent">
                {{ amount(bestBlock.totalAmount + bestBlock.totalFee) }}
                {{ network.currency.symbol }}
              </span>
              from {{ bestBlock.numberOfTransactions || 0 }} transactions
            </p>
            <p class="text-muted">{{ timeAgo(bestBlock.timestamp) }}</p>
          </template>
          <template v-else-if="volume">
            <p class="big-details"><span class="text-muted">N/A</span></p>
            <p class="text-muted">no transferred value in the collected block window</p>
          </template>
          <template v-else>
            <p class="big-details"><span class="text-muted">N/A</span></p>
            <p class="text-muted">waiting for blocks <span class="spinner"></span></p>
          </template>
        </div>

        <div class="big-info">
          <p class="small-title">
            Volume <span class="text-muted">({{ network.currency.symbol }})</span>
          </p>
          <p class="big-details accent">{{ amount(volume?.amount) }}</p>
          <template v-if="volume?.amount">
            <p class="text-muted">
              transferred within {{ timeSpan(volume.beginning, volume.end) }}
            </p>
            <p class="text-muted">
              from {{ volume.txs || 0 }} transactions in {{ volume.withTxs || 0 }} /
              {{ volume.blocks || 0 }} blocks
            </p>
          </template>
          <p v-else-if="volume" class="text-muted">
            no transactions in the collected {{ volume.blocks || 0 }} blocks
          </p>
          <p v-else class="text-muted">waiting for transactions <span class="spinner"></span></p>
          <p v-if="volume && !volume.complete" class="text-muted">
            accumulating up to {{ volume.targetBlocks || 0 }} blocks for a rolling 24-hour window
          </p>
          <p v-else-if="volume?.complete" class="text-muted">rolling 24-hour window</p>
        </div>
      </div>

      <div id="map"></div>
    </div>

    <div v-if="counter" class="cards-grid two-columns">
      <div class="big-info platforms-block">
        <p class="small-title">Platforms</p>
        <div class="platforms">
          <div class="platform">
            <OsIcon os="Darwin" :brand="{ name: 'darwin' }" class="platform-icon" />
            <span class="counter">{{ counter.platforms[1] || 0 }}</span>
          </div>
          <div class="platform">
            <OsIcon os="Linux" :brand="{ name: 'linux' }" class="platform-icon" />
            <span class="counter">{{ counter.platforms[2] || 0 }}</span>
          </div>
          <div class="platform">
            <OsIcon os="FreeBSD" :brand="{ name: 'freebsd' }" class="platform-icon" />
            <span class="counter">{{ counter.platforms[3] || 0 }}</span>
          </div>
        </div>
        <p class="text-muted text-center">
          {{ counter.platforms[0] || 0 }} peers on other platforms
        </p>
      </div>

      <div class="big-info versions-block">
        <p class="small-title">Versions</p>
        <div class="pill-row">
          <div v-for="(version, index) in counter.versions" :key="version" class="pill-stat">
            <span class="pill">{{ version }}</span>
            <span class="counter">{{ counter.versionCounter[index] || 0 }}</span>
          </div>
        </div>
        <p class="text-muted text-center">
          {{ counter.versionCounter[3] || 0 }} peers on other versions
        </p>
      </div>
    </div>

    <div v-if="counter" class="big-info">
      <p class="small-title">Best heights</p>
      <div class="pill-row">
        <div v-for="(height, index) in counter.heights" :key="height" class="pill-stat">
          <span class="pill" :class="{ 'pill-best': index === 0 }">{{ height }}</span>
          <span class="counter">
            {{ counter.heightCounter[index] || 0 }} • {{ counter.heightPercent[index] || 0 }}%
          </span>
        </div>
      </div>
      <p class="text-muted text-center">
        {{ counter.heightCounter[4] || 0 }} • {{ counter.heightPercent[4] || 0 }}% peers at other
        heights
      </p>
    </div>

    <TabsBar v-model="tab" :tabs="tabs" />
    <div class="tab-content">
      <PeersTable v-if="tab === 'connected'" :peers="peers?.connected ?? null" />
      <PeersTable v-else :peers="peers?.disconnected ?? null" />
    </div>
  </section>
</template>
