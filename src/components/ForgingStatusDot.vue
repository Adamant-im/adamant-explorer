<script setup>
// Colored status dot for a delegate's forging state with a hover
// tooltip describing the state and the last forged block.
import { computed } from 'vue';
import { timeAgo } from '../lib/format';

const props = defineProps({
  /** Status descriptor produced by `forgingStatus()` in `lib/forging.js`. */
  status: { type: Object, required: true },
});

/** Text and color class per status code; see `lib/forging.js` for codes. */
const view = computed(() => {
  switch (props.status.code) {
    case 0:
      return { label: 'Forging', tone: 'green', hollow: false };
    case 1:
      return { label: 'Missed block', tone: 'orange', hollow: false };
    case 2:
      return { label: 'Not forging', tone: 'red', hollow: false };
    case 3:
      return { label: 'Awaiting slot', tone: 'green', hollow: true };
    case 4:
      return { label: 'Awaiting slot', tone: 'orange', hollow: true };
    default:
      return { label: 'Awaiting status', tone: 'grey', hollow: true };
  }
});

const tooltip = computed(() => {
  let text = view.value.label;

  if (props.status.code < 5) {
    text += props.status.blockAt
      ? ` — last block at ${props.status.lastBlock.height}, ${timeAgo(props.status.lastBlock.timestamp)}`
      : ' — not forged a block yet';
  }

  return text;
});
</script>

<template>
  <span
    class="forging-dot"
    :class="[`tone-${view.tone}`, { hollow: view.hollow }]"
    :title="tooltip"
  ></span>
</template>
