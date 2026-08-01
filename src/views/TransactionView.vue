<script setup>
// Transaction details page: summary, vote changes, and a details row.
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNetworkStore } from '../stores/network';
import { apiGetOrThrow } from '../lib/api';
import { formatExactCurrency, formatInteger, txSenderLabel, txRecipientLabel } from '../lib/format';
import { liveConfirmations } from '../lib/confirmations';
import { txSenderPath, txRecipientPath } from '../lib/accounts';
import CopyButton from '../components/CopyButton.vue';
import IdentityCell from '../components/IdentityCell.vue';
import OperationType from '../components/OperationType.vue';
import TransactionRow from '../components/TransactionRow.vue';
import TimestampValue from '../components/TimestampValue.vue';

const route = useRoute();
const router = useRouter();
const network = useNetworkStore();

const tx = ref(null);
let refreshPromise = null;

/** Loads the transaction or falls back to the home page when unknown. */
async function getTransaction(txId, reset = true) {
  if (reset) {
    tx.value = null;
  }

  try {
    const data = await apiGetOrThrow('/api/getTransaction', { transactionId: txId });

    tx.value = data.transaction;
  } catch {
    if (reset) {
      router.replace('/');
    }
  }
}

watch(() => route.params.txId, getTransaction, { immediate: true });

watch(
  () => network.latestBlock,
  () => {
    if (!tx.value || tx.value.height || refreshPromise) {
      return;
    }

    refreshPromise = getTransaction(route.params.txId, false).finally(() => {
      refreshPromise = null;
    });
  },
);

const confirmations = computed(() =>
  liveConfirmations(tx.value?.height, network.blockStatus?.height, tx.value?.confirmations),
);
</script>

<template>
  <section>
    <h1>Transaction</h1>

    <div v-if="!tx" class="text-muted">Loading transaction <span class="spinner"></span></div>

    <template v-else>
      <div class="table-responsive">
        <table class="table summary">
          <tbody>
            <tr>
              <td><strong>Transaction ID</strong></td>
              <td class="text-right">
                <span class="copy-value"
                  ><span class="txid">{{ tx.id }}</span
                  ><CopyButton :text="tx.id"
                /></span>
              </td>
            </tr>
            <tr>
              <td><strong>Type</strong></td>
              <td class="text-right"><OperationType :tx="tx" /></td>
            </tr>
            <tr>
              <td><strong>Sender</strong></td>
              <td class="text-right">
                <IdentityCell
                  :address="tx.senderId"
                  :label="txSenderLabel(tx)"
                  :path="txSenderPath(tx)"
                />
              </td>
            </tr>
            <tr>
              <td><strong>Recipient</strong></td>
              <td class="text-right">
                <div v-if="tx.type === 0 || tx.amount">
                  <IdentityCell
                    :address="tx.recipientId"
                    :label="txRecipientLabel(tx)"
                    :path="txRecipientPath(tx)"
                  />
                </div>
                <div v-else>{{ txRecipientLabel(tx) }}</div>
              </td>
            </tr>
            <tr>
              <td><strong>Confirmations</strong></td>
              <td class="text-right">{{ formatInteger(confirmations) }}</td>
            </tr>
            <tr>
              <td><strong>Amount</strong></td>
              <td class="text-right">
                {{ formatExactCurrency(tx.amount, network.currency) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
            </tr>
            <tr>
              <td><strong>Fee</strong></td>
              <td class="text-right">
                {{ formatExactCurrency(tx.fee, network.currency) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
            </tr>
            <tr>
              <td><strong>Timestamp</strong></td>
              <td class="text-right"><TimestampValue :timestamp="tx.timestamp" /></td>
            </tr>
            <tr>
              <td><strong>Block</strong></td>
              <td class="text-right">
                <router-link v-if="tx.blockId" :to="`/block/${tx.blockId}`">
                  {{ tx.blockId }}
                </router-link>
                <span v-else>Unconfirmed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <section v-if="tx.votes?.added?.length">
        <h2>
          Added votes <small>{{ tx.votes.added.length }}</small>
        </h2>
        <p>
          <template v-for="(vote, index) in tx.votes.added" :key="vote.delegate.address">
            <router-link :to="`/address/${vote.delegate.address}`">
              {{ vote.delegate.username || vote.delegate.address }}
            </router-link>
            <span v-if="index < tx.votes.added.length - 1" class="text-muted"> • </span>
          </template>
        </p>
      </section>

      <section v-if="tx.votes?.deleted?.length">
        <h2>
          Deleted votes <small>{{ tx.votes.deleted.length }}</small>
        </h2>
        <p>
          <template v-for="(vote, index) in tx.votes.deleted" :key="vote.delegate.address">
            <router-link :to="`/address/${vote.delegate.address}`">
              {{ vote.delegate.username || vote.delegate.address }}
            </router-link>
            <span v-if="index < tx.votes.deleted.length - 1" class="text-muted"> • </span>
          </template>
        </p>
      </section>

      <h2 class="hide-sm">Ledger entry</h2>
      <div class="table-responsive table-mobile hide-sm">
        <table class="table details">
          <thead>
            <tr>
              <th>Type</th>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Sender</th>
              <th>Recipient</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Confirmations</th>
            </tr>
          </thead>
          <tbody>
            <TransactionRow :tx="tx" neutral-amounts full-amounts />
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
