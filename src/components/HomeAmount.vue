<script setup>
import { computed } from 'vue';
import { useNetworkStore } from '../stores/network';
import { formatHomeAmountParts } from '../lib/format';

const props = defineProps({
  amount: { type: [Number, String], required: true },
});

const network = useNetworkStore();
const parts = computed(() => formatHomeAmountParts(props.amount, network.currency));
</script>

<template>
  <span v-tooltip="`${parts.text} ${network.currency.symbol}`" class="home-amount">
    <strong>{{ parts.integer }}</strong
    ><span v-if="parts.fraction">.{{ parts.fraction }}</span>
    <small>{{ network.currency.symbol }}</small>
  </span>
</template>
