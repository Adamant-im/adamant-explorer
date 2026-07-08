<script setup>
// Single transaction row shared by the transaction lists and the
// transaction details page. On narrow screens the table collapses into
// labeled cards via the `data-title` attributes (see `main.css`).
import { computed } from 'vue';
import { useNetworkStore } from '../stores/network';
import { formatCurrency, formatTimestamp, txSenderLabel, txRecipientLabel } from '../lib/format';
import { txSenderPath, txRecipientPath } from '../lib/accounts';
import CopyButton from './CopyButton.vue';

const props = defineProps({
  /** Transaction to render. */
  tx: { type: Object, required: true },
  /** Address of the page context; colors amounts as incoming/outgoing. */
  address: { type: String, default: undefined },
});

const network = useNetworkStore();

/** Amount badge tone: red for outgoing, green for incoming, grey otherwise. */
const amountTone = computed(() => {
  const { tx, address } = props;

  if (tx.amount > 0 && address === tx.senderId && tx.senderId !== tx.recipientId) {
    return 'txvalues-danger';
  }

  if (tx.amount > 0 && address && tx.senderId !== address) {
    return 'txvalues-success';
  }

  return 'txvalues-default';
});

const confirmations = computed(() => props.tx.confirmations || 0);
</script>

<template>
  <tr>
    <td data-title="Transaction ID" class="text-nowrap">
      <router-link class="ellipsis txid" :to="`/tx/${tx.id}`">{{ tx.id }}</router-link>
      <CopyButton :text="tx.id" />
    </td>
    <td data-title="Date">{{ formatTimestamp(tx.timestamp) }}</td>
    <td data-title="Sender">
      <router-link class="ellipsis" :to="txSenderPath(tx)">{{ txSenderLabel(tx) }}</router-link>
    </td>
    <td data-title="Recipient">
      <router-link v-if="tx.type === 0 || tx.type === 8" class="ellipsis" :to="txRecipientPath(tx)">
        {{ txRecipientLabel(tx) }}
      </router-link>
      <span v-else class="ellipsis">{{ txRecipientLabel(tx) }}</span>
    </td>
    <td data-title="Amount">
      <span class="txvalues" :class="amountTone">
        {{ formatCurrency(tx.amount, network.currency, network.decimalPlaces) }}
        {{ network.currency.symbol }}
      </span>
    </td>
    <td data-title="Fee" class="text-nowrap">
      {{ formatCurrency(tx.fee, network.currency) }} {{ network.currency.symbol }}
    </td>
    <td data-title="Confirmations">
      <span v-if="!confirmations" class="text-danger">Unconfirmed Transaction!</span>
      <span v-else-if="confirmations < 101" class="text-warning">{{ confirmations }}</span>
      <span v-else class="text-success" :title="`${confirmations} Confirmations`">Confirmed</span>
    </td>
  </tr>
</template>
