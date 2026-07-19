<script setup>
// Sortable transaction table over a Less/More loader
// (see `lib/lessMore.js`), used by the block and address pages.
import { computed, nextTick } from 'vue';
import { useSort } from '../lib/sort';
import SortIndicator from './SortIndicator.vue';
import TransactionRow from './TransactionRow.vue';

const props = defineProps({
  /** Reactive loader created with `useLessMore()`. */
  txs: { type: Object, required: true },
  /** Page context address for amount coloring. */
  address: { type: String, default: undefined },
  /** Do not apply incoming/outgoing amount colors. */
  neutralAmounts: { type: Boolean, default: false },
  /** Preserve all amount decimals. */
  fullAmounts: { type: Boolean, default: false },
});

const sort = useSort('timestamp', true);

const columns = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Transaction ID' },
  { key: 'timestamp', label: 'Date' },
  { key: 'senderId', label: 'Sender' },
  { key: 'recipientId', label: 'Recipient' },
  { key: 'amount', label: 'Amount' },
  { key: 'fee', label: 'Fee' },
  { key: 'confirmations', label: 'Confirmations' },
];

const rows = computed(() => sort.sorted(props.txs.results));

/** Loads another page without moving the reader away from the button. */
async function loadMore() {
  const scrollTop = window.scrollY;

  await props.txs.loadMore();
  await nextTick();
  window.scrollTo({ top: scrollTop, behavior: 'instant' });
}
</script>

<template>
  <div>
    <div v-if="!txs.loading && !txs.results.length" class="alert alert-warning">
      There are no transactions involving this {{ txs.parent }}.
    </div>

    <div v-if="txs.results.length" class="table-responsive table-mobile">
      <table class="table transactions">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              role="button"
              :class="sort.key === column.key ? 'sorted' : ''"
              @click="sort.order(column.key)"
            >
              {{ column.label }}
              <SortIndicator v-if="sort.key === column.key" :reverse="sort.reverse" />
            </th>
          </tr>
        </thead>
        <tbody>
          <TransactionRow
            v-for="tx in rows"
            :key="tx.id"
            :tx="tx"
            :address="address"
            :neutral-amounts="neutralAmounts"
            :full-amounts="fullAmounts"
          />
        </tbody>
      </table>
    </div>

    <div v-if="txs.loading" class="progress-loading">Loading transactions…</div>

    <div v-if="txs.moreData" class="btn-pair">
      <button type="button" class="btn btn-primary" @click="loadMore">More</button>
    </div>
  </div>
</template>
