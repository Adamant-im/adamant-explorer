<script setup>
// Home page: latest transfer operations, refreshed every 30 seconds.
import { onBeforeUnmount, ref } from 'vue';
import { useNetworkStore } from '../stores/network';
import { apiGet } from '../lib/api';
import { formatCurrency, formatTimestamp, txSenderLabel, txRecipientLabel } from '../lib/format';
import { txSenderPath, txRecipientPath } from '../lib/accounts';

const network = useNetworkStore();
const txs = ref([]);

/** Fetches the latest transfers; keeps the current list on failure. */
async function getLastTransfers() {
  try {
    const data = await apiGet('/api/getLastTransfers');

    if (data.success) {
      txs.value = data.transactions;
    }
  } catch {
    // Transient network failures are fine here: the timer retries
  }
}

getLastTransfers();
const timer = setInterval(getLastTransfers, 30000);
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <section>
    <div class="page-title">
      <h1>Latest Operations</h1>
      <div class="page-note">Note: Messaging and service transactions are hidden</div>
    </div>
    <hr />
    <div class="table-responsive">
      <table class="table table-striped latest-transactions">
        <thead>
          <tr>
            <th>Id</th>
            <th class="text-right hide-sm">Timestamp</th>
            <th class="text-right hide-sm">Sender</th>
            <th class="text-right hide-sm">Recipient</th>
            <th class="text-right">Amount ({{ network.currency.symbol }})</th>
            <th class="text-right hide-sm">Fee ({{ network.currency.symbol }})</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!txs.length">
            <td colspan="6">Waiting for transactions <span class="spinner"></span></td>
          </tr>
          <tr v-for="tx in txs" :key="tx.id">
            <td>
              <router-link class="ellipsis" :to="`/tx/${tx.id}`">{{ tx.id }}</router-link>
            </td>
            <td class="text-right hide-sm">
              <span class="ellipsis">{{ formatTimestamp(tx.timestamp) }}</span>
            </td>
            <td class="text-right hide-sm">
              <router-link class="ellipsis" :to="txSenderPath(tx)">
                {{ txSenderLabel(tx) }}
              </router-link>
            </td>
            <td class="text-right hide-sm">
              <router-link
                v-if="tx.type === 0 || tx.type === 8"
                class="ellipsis"
                :to="txRecipientPath(tx)"
              >
                {{ txRecipientLabel(tx) }}
              </router-link>
              <span v-else class="ellipsis">{{ txRecipientLabel(tx) }}</span>
            </td>
            <td class="text-right">
              <span class="ellipsis">
                {{ formatCurrency(tx.amount, network.currency, network.decimalPlaces) }}
              </span>
            </td>
            <td class="text-right hide-sm">
              <span class="ellipsis">{{ formatCurrency(tx.fee, network.currency) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
