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
import { formatCurrency, formatInteger, timeSpan } from '../lib/format';
import { compareVersionsDescending, groupPeerHeights } from '../lib/peers.js';
import TabsBar from '../components/TabsBar.vue';
import PeersTable from '../components/PeersTable.vue';
import OsIcon from '../components/OsIcon.vue';
import TimestampValue from '../components/TimestampValue.vue';

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
  const heightGroups = groupPeerHeights(connected.map((peer) => peer.height));

  for (const peer of connected) {
    // Platform groups: 0 other, 1 darwin, 2 linux, 3 freebsd
    if (typeof peer.osBrand?.group === 'number') {
      platformCounter[peer.osBrand.group]++;
    }

    const versionIndex = versions.indexOf(peer.version);
    versionCounter[versionIndex === -1 ? 3 : versionIndex]++;
  }

  return {
    connected: connected.length,
    disconnected: peers.value.disconnected.length,
    total: connected.length + peers.value.disconnected.length,
    platforms: platformCounter,
    versions,
    versionCounter,
    heightGroups,
  };
});

const synchronizedPercent = computed(() => counter.value?.heightGroups.groups[0]?.percent ?? 0);

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
  <section class="network-monitor">
    <header class="monitor-title">
      <div>
        <span class="monitor-kicker">Live topology</span>
        <h1>Network Monitor</h1>
      </div>
      <p>
        Connection coverage, chain alignment and node distribution from the explorer's current peer
        set
      </p>
    </header>

    <div class="network-overview">
      <article class="network-pulse">
        <span class="small-title">Peer coverage</span>
        <div class="network-pulse-value">
          <strong>{{ formatInteger(counter?.connected || 0) }}</strong>
          <span>/ {{ formatInteger(counter?.total || 0) }}</span>
        </div>
        <div class="sync-meter" aria-label="Peers at the best height">
          <i :style="{ width: `${synchronizedPercent}%` }"></i>
        </div>
        <p>
          <strong>{{ synchronizedPercent }}%</strong> at the best height
          <span>· {{ formatInteger(counter?.disconnected || 0) }} disconnected</span>
        </p>
      </article>
      <div class="network-map-shell">
        <div class="map-caption">
          <span>Connected node locations</span>
          <small>Markers stay visually distinct in both themes</small>
        </div>
        <div id="map"></div>
      </div>
    </div>

    <div class="network-metrics">
      <article>
        <span class="small-title">Last block</span>
        <template v-if="lastBlock">
          <router-link class="metric-id" :to="`/block/${lastBlock.id}`">{{
            lastBlock.id
          }}</router-link>
          <strong>{{ amount(lastBlock.totalAmount) }} {{ network.currency.symbol }}</strong>
          <p>
            {{ formatInteger(lastBlock.numberOfTransactions || 0) }} transactions ·
            <TimestampValue :timestamp="lastBlock.timestamp" relative />
          </p>
        </template>
        <p v-else>Waiting for block <span class="spinner"></span></p>
      </article>
      <article>
        <span class="small-title">Best value block</span>
        <template v-if="bestBlock">
          <router-link class="metric-id" :to="`/block/${bestBlock.id}`">{{
            bestBlock.id
          }}</router-link>
          <strong>{{ amount(bestBlock.totalAmount) }} {{ network.currency.symbol }}</strong>
          <p>
            {{ formatInteger(bestBlock.numberOfTransactions || 0) }} transactions ·
            <TimestampValue :timestamp="bestBlock.timestamp" relative />
          </p>
        </template>
        <p v-else>Waiting for the collected block window <span class="spinner"></span></p>
      </article>
      <article>
        <span class="small-title">Rolling volume</span>
        <strong>{{ amount(volume?.amount) }} {{ network.currency.symbol }}</strong>
        <p v-if="volume?.amount">
          {{ formatInteger(volume.txs || 0) }} transactions in
          {{ timeSpan(volume.beginning, volume.end) }}
        </p>
        <p v-else>Waiting for transferred value <span class="spinner"></span></p>
        <small v-if="volume && !volume.complete">
          Collecting {{ formatInteger(volume.blocks || 0) }} /
          {{ formatInteger(volume.targetBlocks || 0) }} blocks
        </small>
        <small v-else-if="volume?.complete">Complete 24-hour window</small>
      </article>
    </div>

    <div v-if="counter" class="network-distribution">
      <article>
        <span class="small-title">Platforms</span>
        <div class="platforms">
          <div class="platform">
            <OsIcon os="macOS" :brand="{ name: 'darwin' }" class="platform-icon" />
            <span>macOS</span>
            <strong>{{ counter.platforms[1] || 0 }}</strong>
          </div>
          <div class="platform">
            <OsIcon os="Linux" :brand="{ name: 'linux' }" class="platform-icon" />
            <span>Linux</span>
            <strong>{{ counter.platforms[2] || 0 }}</strong>
          </div>
          <div class="platform">
            <OsIcon os="FreeBSD" :brand="{ name: 'freebsd' }" class="platform-icon" />
            <span>FreeBSD</span>
            <strong>{{ counter.platforms[3] || 0 }}</strong>
          </div>
        </div>
        <small>{{ counter.platforms[0] || 0 }} on other platforms</small>
      </article>

      <article>
        <span class="small-title">Node versions</span>
        <div class="distribution-list">
          <div v-for="(version, index) in counter.versions" :key="version">
            <span>{{ version }}</span
            ><strong>{{ counter.versionCounter[index] || 0 }}</strong>
          </div>
        </div>
        <small>{{ counter.versionCounter[3] || 0 }} on other versions</small>
      </article>

      <article>
        <span class="small-title">Best heights</span>
        <div class="distribution-list">
          <div
            v-for="(group, index) in counter.heightGroups.groups"
            :key="group.height"
            :class="{ best: index === 0 }"
          >
            <span>{{ formatInteger(group.height) }}</span>
            <strong>{{ group.count }} · {{ group.percent }}%</strong>
          </div>
        </div>
        <small>
          {{ counter.heightGroups.otherCount }} · {{ counter.heightGroups.otherPercent }}% peers at
          other heights
        </small>
      </article>
    </div>

    <TabsBar v-model="tab" :tabs="tabs" />
    <div class="tab-content">
      <PeersTable v-if="tab === 'connected'" :peers="peers?.connected ?? null" />
      <PeersTable v-else :peers="peers?.disconnected ?? null" />
    </div>
  </section>
</template>
