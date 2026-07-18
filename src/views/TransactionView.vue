<script setup>
// Transaction details page: summary, vote changes, and a details row.
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNetworkStore } from '../stores/network';
import { apiGetOrThrow } from '../lib/api';
import { formatCurrency, formatTimestamp, txSenderLabel, txRecipientLabel } from '../lib/format';
import { txSenderPath, txRecipientPath } from '../lib/accounts';
import CopyButton from '../components/CopyButton.vue';
import IdentityCell from '../components/IdentityCell.vue';
import OperationType from '../components/OperationType.vue';
import TransactionRow from '../components/TransactionRow.vue';

const route = useRoute();
const router = useRouter();
const network = useNetworkStore();

const tx = ref(null);

/** Loads the transaction or falls back to the home page when unknown. */
async function getTransaction(txId) {
  tx.value = null;

  try {
    const data = await apiGetOrThrow('/api/getTransaction', { transactionId: txId });

    tx.value = data.transaction;
  } catch {
    router.replace('/');
  }
}

watch(() => route.params.txId, getTransaction, { immediate: true });
</script>

<template>
  <section>
    <h1>
      Transaction <small class="ellipsis">{{ route.params.txId }}</small>
    </h1>

    <div v-if="!tx" class="text-muted">Loading transaction <span class="spinner"></span></div>

    <template v-else>
      <div class="well ellipsis">
        <strong>Transaction ID</strong>
        <span class="txid text-muted">{{ tx.id }}</span>
        <CopyButton :text="tx.id" />
      </div>

      <h2>Summary</h2>
      <div class="table-responsive">
        <table class="table summary">
          <tbody>
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
              <td class="text-right">{{ tx.confirmations || 0 }}</td>
            </tr>
            <tr>
              <td><strong>Amount</strong></td>
              <td class="text-right">
                {{ formatCurrency(tx.amount, network.currency, network.decimalPlaces) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
            </tr>
            <tr>
              <td><strong>Fee</strong></td>
              <td class="text-right">
                {{ formatCurrency(tx.fee, network.currency) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
            </tr>
            <tr>
              <td><strong>Timestamp</strong></td>
              <td class="text-right">{{ formatTimestamp(tx.timestamp) }}</td>
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

      <h2>Details</h2>
      <div class="table-responsive table-mobile">
        <table class="table details">
          <thead>
            <tr>
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
            <TransactionRow :tx="tx" :address="tx.senderId" />
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
