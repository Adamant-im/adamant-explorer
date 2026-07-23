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
  { key: 'id', label: 'Transaction ID', short: 'ID' },
  { key: 'timestamp', label: 'Date' },
  { key: 'senderId', label: 'Sender' },
  { key: 'recipientId', label: 'Recipient' },
  { key: 'amount', label: 'Amount' },
  { key: 'fee', label: 'Fee' },
  { key: 'confirmations', label: 'Confirmations' },
];

const rows = computed(() => sort.sorted(props.txs.results));

// Block pages show a compact static list on small screens: the date
// column and sorting are dropped there (see `main.css`).
const isBlockList = computed(() => props.txs.parent === 'block');

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

    <div
      v-if="txs.results.length"
      class="table-responsive"
      :class="{ 'no-mobile-date no-mobile-sort': isBlockList }"
    >
      <table class="table transactions">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="sort.key === column.key ? 'sorted' : ''"
              :aria-sort="
                sort.key === column.key ? (sort.reverse ? 'descending' : 'ascending') : 'none'
              "
            >
              <button type="button" class="table-sort-button" @click="sort.order(column.key)">
                <template v-if="column.short">
                  <span class="hide-sm">{{ column.label }}</span>
                  <span class="show-sm">{{ column.short }}</span>
                </template>
                <template v-else>{{ column.label }}</template>
                <SortIndicator v-if="sort.key === column.key" :reverse="sort.reverse" />
              </button>
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
