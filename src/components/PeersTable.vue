<script setup>
// Sortable peer table for the Network Monitor. At narrow widths the
// data-title attributes turn each row into a labeled peer card.
import { computed } from 'vue';
import { useSort } from '../lib/sort.js';
import { peerFlagClass, peerStateClass } from '../lib/peers.js';
import OsIcon from './OsIcon.vue';
import SortIndicator from './SortIndicator.vue';
import { formatInteger } from '../lib/format.js';

const props = defineProps({
  /** Peer list; `null`/`undefined` renders the waiting state. */
  peers: { type: Array, default: null },
});

const sort = useSort('ip');

const columns = [
  { key: 'ip', label: 'IP Address' },
  { key: 'port', label: 'Port' },
  { key: 'location.hostname', label: 'Hostname' },
  { key: 'location.country_name', label: 'Country' },
  { key: 'state', label: 'Status' },
  { key: 'version', label: 'Version' },
  { key: 'os', label: 'Platform' },
  { key: 'height', label: 'Height' },
];

const rows = computed(() => sort.sorted(props.peers));

/** Selects a peer sort field without toggling the current direction. */
function selectSort(event) {
  const key = event.target.value;

  if (key !== sort.key) {
    sort.order(key);
  }
}
</script>

<template>
  <div class="table-responsive table-mobile peers-table">
    <div class="mobile-sort-controls" role="group" aria-label="Peer sorting controls">
      <select :value="sort.key" aria-label="Sort peers by" @change="selectSort">
        <option v-for="column in columns" :key="column.key" :value="column.key">
          {{ column.label }}
        </option>
      </select>
      <button
        type="button"
        class="btn mobile-sort-direction"
        :aria-label="`${sort.reverse ? 'Descending' : 'Ascending'} order; activate to sort ${
          sort.reverse ? 'ascending' : 'descending'
        }`"
        @click="sort.order(sort.key)"
      >
        {{ sort.reverse ? 'Descending' : 'Ascending' }}
        <SortIndicator :reverse="sort.reverse" />
      </button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="sort.key === column.key ? 'sorted' : ''"
            :aria-sort="
              sort.key === column.key ? (sort.reverse ? 'descending' : 'ascending') : 'none'
            "
          >
            <button type="button" class="table-sort-button" @click="sort.order(column.key)">
              {{ column.label }}
              <SortIndicator v-if="sort.key === column.key" :reverse="sort.reverse" />
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!peers">
          <td class="table-empty" colspan="8">Waiting for peers <span class="spinner"></span></td>
        </tr>
        <tr v-else-if="!rows.length">
          <td class="table-empty" colspan="8">No peers in this group.</td>
        </tr>
        <tr v-for="peer in rows" :key="`${peer.ip}:${peer.port}`">
          <td data-title="IP Address">
            <span class="text-muted peer-ip" :aria-label="`IP address ${peer.ip}`" :title="peer.ip">
              {{ peer.ip }}
            </span>
          </td>
          <td data-title="Port">
            <span class="text-muted">{{ peer.port }}</span>
          </td>
          <td data-title="Hostname">
            <span v-tooltip="peer.location?.hostname" class="text-muted ellipsis hostname">
              {{ peer.location?.hostname || 'N/A' }}
            </span>
          </td>
          <td data-title="Country">
            <span
              v-tooltip="peer.location?.country_name"
              class="peer-country"
              role="img"
              :aria-label="`Country: ${peer.location?.country_name || 'Unknown'}`"
            >
              <span
                class="flag"
                :class="peerFlagClass(peer.location?.country_code)"
                aria-hidden="true"
              ></span>
              <span class="peer-mobile-label">{{ peer.location?.country_name || 'Unknown' }}</span>
            </span>
          </td>
          <td data-title="Status">
            <span
              v-tooltip="peer.humanState"
              class="peer-status"
              role="img"
              :aria-label="`Status: ${peer.humanState || 'Unknown'}`"
            >
              <span
                class="peer-state"
                :class="peerStateClass(peer.state)"
                aria-hidden="true"
              ></span>
              <span class="peer-mobile-label">{{ peer.humanState || 'Unknown' }}</span>
            </span>
          </td>
          <td data-title="Version">
            <span class="text-muted">{{ peer.version }}</span>
          </td>
          <td data-title="Platform">
            <span class="peer-platform">
              <OsIcon :os="peer.os" :brand="peer.osBrand" />
              <span class="peer-mobile-label">{{ peer.os || 'Unknown' }}</span>
            </span>
          </td>
          <td data-title="Height">{{ formatInteger(peer.height) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
