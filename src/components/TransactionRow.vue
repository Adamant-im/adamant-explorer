<script setup>
// Single transaction row shared by the transaction lists and the
// transaction details page. On narrow screens the table collapses into
// labeled cards via the `data-title` attributes (see `main.css`).
import { computed } from 'vue';
import { useNetworkStore } from '../stores/network';
import { formatCurrency, formatTimestamp, txSenderLabel, txRecipientLabel } from '../lib/format';
import { txSenderPath } from '../lib/accounts';
import { operationRecipient } from '../lib/transactionTypes.js';
import CopyButton from './CopyButton.vue';
import IdentityCell from './IdentityCell.vue';
import OperationType from './OperationType.vue';

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

const sender = computed(() => ({
  address: props.tx.senderId,
  label: txSenderLabel(props.tx),
  path: txSenderPath(props.tx),
}));

const recipient = computed(() => {
  const identity = operationRecipient(props.tx);

  if (identity) {
    return {
      ...identity,
      path: `${identity.isDelegate ? '/delegate' : '/address'}/${identity.address}`,
    };
  }

  return null;
});
</script>

<template>
  <tr>
    <td data-title="Type"><OperationType :tx="tx" /></td>
    <td data-title="Transaction ID" class="text-nowrap">
      <router-link class="ellipsis txid" :to="`/tx/${tx.id}`">{{ tx.id }}</router-link>
      <CopyButton :text="tx.id" />
    </td>
    <td data-title="Date">{{ formatTimestamp(tx.timestamp) }}</td>
    <td data-title="Sender">
      <IdentityCell v-bind="sender" />
    </td>
    <td data-title="Recipient">
      <IdentityCell v-if="recipient" v-bind="recipient" />
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
