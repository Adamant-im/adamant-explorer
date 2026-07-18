<script setup>
// Single transaction row shared by the transaction lists and the
// transaction details page. On narrow screens the table collapses into
// labeled cards via the `data-title` attributes (see `main.css`).
import { computed } from 'vue';
import { useNetworkStore } from '../stores/network';
import {
  formatCurrency,
  formatExactCurrency,
  formatInteger,
  txSenderLabel,
  txRecipientLabel,
} from '../lib/format';
import { liveConfirmations } from '../lib/confirmations';
import { txSenderPath } from '../lib/accounts';
import { operationRecipient } from '../lib/transactionTypes.js';
import CopyButton from './CopyButton.vue';
import IdentityCell from './IdentityCell.vue';
import OperationType from './OperationType.vue';
import TimestampValue from './TimestampValue.vue';

const props = defineProps({
  /** Transaction to render. */
  tx: { type: Object, required: true },
  /** Address of the page context; colors amounts as incoming/outgoing. */
  address: { type: String, default: undefined },
  /** Do not apply incoming/outgoing amount colors. */
  neutralAmounts: { type: Boolean, default: false },
  /** Preserve all on-chain decimals in the amount column. */
  fullAmounts: { type: Boolean, default: false },
});

const network = useNetworkStore();

/** Amount badge tone: red for outgoing, green for incoming, grey otherwise. */
const amountTone = computed(() => {
  const { tx, address } = props;

  if (props.neutralAmounts) {
    return 'txvalues-default';
  }

  if (tx.amount > 0 && address === tx.senderId && tx.senderId !== tx.recipientId) {
    return 'txvalues-danger';
  }

  if (tx.amount > 0 && address === tx.recipientId && tx.senderId !== address) {
    return 'txvalues-success';
  }

  return 'txvalues-default';
});

const confirmations = computed(() =>
  liveConfirmations(props.tx.height, network.blockStatus?.height, props.tx.confirmations),
);

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
    <td data-title="Date"><TimestampValue :timestamp="tx.timestamp" /></td>
    <td data-title="Sender">
      <IdentityCell v-bind="sender" />
    </td>
    <td data-title="Recipient">
      <IdentityCell v-if="recipient" v-bind="recipient" />
      <span v-else class="ellipsis">{{ txRecipientLabel(tx) }}</span>
    </td>
    <td data-title="Amount">
      <span class="txvalues" :class="amountTone">
        {{
          fullAmounts
            ? formatExactCurrency(tx.amount, network.currency)
            : formatCurrency(tx.amount, network.currency, network.decimalPlaces)
        }}
        {{ network.currency.symbol }}
      </span>
    </td>
    <td data-title="Fee" class="text-nowrap">
      {{
        fullAmounts
          ? formatExactCurrency(tx.fee, network.currency)
          : formatCurrency(tx.fee, network.currency)
      }}
      {{ network.currency.symbol }}
    </td>
    <td data-title="Confirmations">
      <span v-if="!confirmations" class="text-danger">Unconfirmed Transaction!</span>
      <span v-else-if="confirmations < 101" class="text-warning">{{
        formatInteger(confirmations)
      }}</span>
      <span v-else class="text-success" :title="`${formatInteger(confirmations)} confirmations`">
        Confirmed
      </span>
    </td>
  </tr>
</template>
