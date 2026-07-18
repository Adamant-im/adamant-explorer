<script setup>
// Home page: latest public operations, refreshed after every new block.
import { ref, watch } from 'vue';
import { IconChevronRight, IconTopologyStar3 } from '@tabler/icons-vue';
import { useNetworkStore } from '../stores/network';
import { apiGet } from '../lib/api';
import { createBlockRefreshTrigger } from '../lib/blockRefresh';
import { txSenderLabel } from '../lib/format';
import { txSenderPath } from '../lib/accounts';
import { operationRecipient } from '../lib/transactionTypes.js';
import HomeAmount from '../components/HomeAmount.vue';
import IdentityCell from '../components/IdentityCell.vue';
import OperationType from '../components/OperationType.vue';
import TimestampValue from '../components/TimestampValue.vue';

const network = useNetworkStore();
const txs = ref([]);

/** Fetch the latest public operations; the server versions its cache by latest block. */
async function getLastTransfers() {
  try {
    const data = await apiGet('/api/getLastTransfers');

    if (data.success) {
      txs.value = data.transactions.slice(0, 20);
    }
  } catch {
    // Keep the current list; the next block or status fallback retries
  }
}

/** Identity displayed in the sender half of the operation path. */
function senderIdentity(tx) {
  return {
    address: tx.senderId,
    label: txSenderLabel(tx),
    path: txSenderPath(tx),
  };
}

/** Identity displayed in the recipient half of the operation path. */
function recipientIdentity(tx) {
  const recipient = operationRecipient(tx);

  if (!recipient) {
    return { address: '', label: '', path: '' };
  }

  return {
    ...recipient,
    path: `${recipient.isDelegate ? '/delegate' : '/address'}/${recipient.address}`,
  };
}

getLastTransfers();

const refreshOnBlock = createBlockRefreshTrigger(getLastTransfers, network.latestBlock);

watch(
  () => network.latestBlock,
  (block) => void refreshOnBlock(block),
);
</script>

<template>
  <section class="operations-panel">
    <div class="operations-heading">
      <div>
        <span class="section-mark"><IconTopologyStar3 aria-hidden="true" /></span>
        <h1>Latest operations</h1>
      </div>
    </div>

    <div class="table-responsive operations-table-wrap">
      <table class="table latest-transactions">
        <thead>
          <tr>
            <th>Type</th>
            <th>Timestamp</th>
            <th>Sender</th>
            <th>Recipient</th>
            <th class="text-right">Amount</th>
            <th><span class="sr-only">View</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!txs.length">
            <td colspan="6">Waiting for operations <span class="spinner"></span></td>
          </tr>
          <tr v-for="tx in txs" :key="tx.id">
            <td data-title="Type">
              <OperationType :tx="tx" />
            </td>
            <td data-title="Timestamp" class="operation-time">
              <TimestampValue :timestamp="tx.timestamp" />
            </td>
            <td data-title="Sender">
              <IdentityCell v-bind="senderIdentity(tx)" />
            </td>
            <td data-title="Recipient">
              <IdentityCell v-bind="recipientIdentity(tx)" />
            </td>
            <td data-title="Amount" class="text-right operation-amount">
              <HomeAmount :amount="tx.amount" />
            </td>
            <td class="operation-open">
              <router-link :to="`/tx/${tx.id}`" :title="`Open transaction ${tx.id}`">
                <IconChevronRight aria-hidden="true" />
                <span class="sr-only">View transaction {{ tx.id }}</span>
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="operations-summary">
      <span>Showing {{ txs.length }} latest operations</span>
    </div>
  </section>
</template>
