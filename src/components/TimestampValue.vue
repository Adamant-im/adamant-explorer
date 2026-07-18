<script setup>
import { computed } from 'vue';
import { formatTimestamp, timeAgo, timestampTitle } from '../lib/format.js';

const props = defineProps({
  /** Timestamp in seconds since the ADAMANT epoch. */
  timestamp: { type: [Number, String], required: true },
  /** Show a concise relative value instead of local date and time. */
  relative: { type: Boolean, default: false },
});

const label = computed(() =>
  props.relative ? timeAgo(Number(props.timestamp)) : formatTimestamp(Number(props.timestamp)),
);
</script>

<template>
  <time
    v-tooltip="timestampTitle(Number(timestamp))"
    :datetime="String(timestamp)"
    :aria-label="timestampTitle(Number(timestamp))"
  >
    {{ label }}
  </time>
</template>
