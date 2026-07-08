<script setup>
// Sortable peer table for the Network Monitor.
import { computed } from 'vue';
import { useSort } from '../lib/sort';
import OsIcon from './OsIcon.vue';

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
</script>

<template>
  <div class="table-responsive">
    <table class="table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            role="button"
            :class="sort.key === column.key ? 'sorted' : ''"
            @click="sort.order(column.key)"
          >
            {{ column.label }}
            <span v-if="sort.key === column.key" class="sort-arrow">{{
              sort.reverse ? '▴' : '▾'
            }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!peers">
          <td colspan="8">Waiting for peers <span class="spinner"></span></td>
        </tr>
        <tr v-for="peer in rows" :key="`${peer.ip}:${peer.port}`">
          <td>
            <span class="text-muted">{{ peer.ip }}</span>
          </td>
          <td>
            <span class="text-muted">{{ peer.port }}</span>
          </td>
          <td>
            <span class="text-muted ellipsis hostname" :title="peer.location?.hostname">
              {{ peer.location?.hostname || 'N/A' }}
            </span>
          </td>
          <td>
            <span
              class="flag"
              :class="`flag-${(peer.location?.country_code || '').toLowerCase()}`"
              :title="peer.location?.country_name"
            ></span>
          </td>
          <td>
            <span class="peer-state" :class="`state-${peer.state}`" :title="peer.humanState"></span>
          </td>
          <td>
            <span class="text-muted">{{ peer.version }}</span>
          </td>
          <td><OsIcon :os="peer.os" :brand="peer.osBrand" /></td>
          <td>{{ peer.height }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
