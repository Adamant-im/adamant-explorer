<script setup>
// Network Monitor: peer statistics and a world map of connected peers,
// fed by the `/networkMonitor` socket namespace.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useNetworkStore } from '../stores/network.js';
import { useSocket } from '../composables/useSocket.js';
import { formatCurrency, formatInteger, timeSpan } from '../lib/format.js';
import {
  compareVersionsDescending,
  groupPeerHeights,
  peerCoordinates,
  peerPlatformName,
  peerPopupRows,
} from '../lib/peers.js';
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
const markers = new Map();

/** Marker icons per OS brand; unknown platforms share one icon. */
const platformIcons = new Map();

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
    platformIcons.set(name, new PlatformIcon({ iconUrl: `/leaflet/marker-icon-${name}.png` }));
  }
}

/**
 * Builds a peer popup with DOM text nodes so node and geo data are never parsed as HTML.
 *
 * @param {Object} peer Enriched peer
 * @returns {HTMLDivElement} Leaflet popup content
 */
function createPeerPopup(peer) {
  const popup = document.createElement('div');

  for (const { label, value, className } of peerPopupRows(peer)) {
    const row = document.createElement('p');

    if (className) {
      row.className = className;
    }

    if (label) {
      const labelElement = document.createElement('span');
      labelElement.className = 'label';
      labelElement.textContent = `${label}: `;
      row.append(labelElement);
    }

    row.append(document.createTextNode(value));
    popup.append(row);
  }

  return popup;
}

/** Adds markers for newly connected peers and drops disconnected ones. */
function updateMap(list) {
  if (!map) {
    return;
  }

  const connectedIps = new Set();

  for (const peer of list.connected) {
    const coordinates = peerCoordinates(peer);
    const ip = typeof peer.ip === 'string' ? peer.ip : '';

    if (!coordinates || !ip) {
      continue;
    }

    if (!markers.has(ip)) {
      const marker = L.marker(coordinates, {
        title: typeof peer.ipString === 'string' ? peer.ipString : ip,
        icon:
          platformIcons.get(peerPlatformName(peer.osBrand?.name)) ?? platformIcons.get('unknown'),
      }).bindPopup(createPeerPopup(peer));
      markers.set(ip, marker);
      cluster.addLayer(marker);
    }

    connectedIps.add(ip);
  }

  for (const [ip, marker] of markers) {
    if (!connectedIps.has(ip)) {
      cluster.removeLayer(marker);
      markers.delete(ip);
    }
  }

  map.addLayer(cluster);
}

// --- Counters ---------------------------------------------------------

/** Deduplicates peers reported twice under the same id. */
function dedupe(list) {
  const seen = new Set();

  return list.filter((peer) => {
    if (!peer || typeof peer !== 'object' || !peer.id || seen.has(peer.id)) {
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
    const platformGroup = peer.osBrand?.group;
    const platformIndex =
      Number.isInteger(platformGroup) && platformGroup >= 1 && platformGroup <= 3
        ? platformGroup
        : 0;
    platformCounter[platformIndex]++;

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
  if (!Array.isArray(payload?.list?.connected) || !Array.isArray(payload.list.disconnected)) {
    return;
  }

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
          <small>Clusters: green 2–9 · yellow 10–99 · orange 100+ nodes</small>
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
