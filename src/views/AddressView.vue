<script setup>
// Address page: account summary, QR code, votes, and the transaction
// history with direction filters and an advanced search form.
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNetworkStore } from '../stores/network';
import { apiGetOrThrow } from '../lib/api';
import { useLessMore } from '../lib/lessMore';
import { formatCurrency, SAT } from '../lib/format';
import CopyButton from '../components/CopyButton.vue';
import QrCode from '../components/QrCode.vue';
import VotesList from '../components/VotesList.vue';
import TransactionsList from '../components/TransactionsList.vue';

const route = useRoute();
const router = useRouter();
const network = useNetworkStore();

const account = ref(null);
const txs = ref(null);
/** Active direction filter: '', 'sent', 'received', 'others', or 'search'. */
const direction = ref('');

const searchOpen = ref(false);
const searchError = ref('');
/** Advanced search inputs, forwarded to `/api/getTransfersByAddress`. */
const search = reactive({
  senderId: '',
  recipientId: '',
  minAmount: '',
  maxAmount: '',
  type: '',
});

const qrContent = computed(() => `https://msg.adamant.im?address=${route.params.address}`);

/** Loads the account summary or leaves for the home page when unknown. */
async function getAccount(address) {
  account.value = null;

  try {
    account.value = await apiGetOrThrow('/api/getAccount', { address });
  } catch {
    router.replace('/');
  }
}

/**
 * (Re)creates the transaction loader for a direction filter.
 * @param {string} [dir] Direction filter; empty string loads everything
 */
function filterTxs(dir = '') {
  direction.value = dir;
  txs.value = useLessMore({
    url: '/api/getTransfersByAddress',
    key: 'transactions',
    parent: 'address',
    params: { address: route.params.address, direction: dir || undefined },
  });
  txs.value.loadData();
}

/** Runs the advanced search across the transfer history. */
function runSearch() {
  searchError.value = '';

  const params = {};

  if (search.senderId) params.senderId = search.senderId;
  if (search.recipientId) params.recipientId = search.recipientId;
  if (search.type) params.type = search.type;
  // Amounts are entered in ADM but the API expects sats
  if (search.minAmount) params.minAmount = Math.floor(parseFloat(search.minAmount) * SAT);
  if (search.maxAmount) params.maxAmount = Math.floor(parseFloat(search.maxAmount) * SAT);

  if (!Object.keys(params).length) {
    filterTxs();
    return;
  }

  // Scope the search to this address unless an explicit party is given
  if (!params.senderId && !params.recipientId) {
    params.senderId = route.params.address;
    params.recipientId = route.params.address;
  }

  const isValidAddress = (id) => /^U\d+$/.test(id || '');

  if (!isValidAddress(params.senderId) && !isValidAddress(params.recipientId)) {
    searchError.value =
      'Please provide a valid address for sender id and/or recipient id. Username is not accepted.';
    return;
  }

  direction.value = 'search';
  txs.value = useLessMore({
    url: '/api/getTransfersByAddress',
    key: 'transactions',
    parent: 'address',
    params,
  });
  txs.value.loadData();
}

/** Clears the advanced search and restores the unfiltered history. */
function resetSearch() {
  Object.keys(search).forEach((key) => (search[key] = ''));
  searchError.value = '';
  filterTxs();
}

watch(
  () => route.params.address,
  (address) => {
    getAccount(address);
    filterTxs();
  },
  { immediate: true },
);
</script>

<template>
  <section>
    <div v-if="!account" class="text-muted">Loading address <span class="spinner"></span></div>

    <template v-else>
      <h2>
        Address Summary
        <small v-if="account.secondSignature" title="Second signature">🔒</small>
      </h2>

      <div class="address-layout">
        <div class="table-responsive">
          <table class="table summary">
            <tbody>
              <tr v-if="account.knowledge">
                <td><strong>Owner</strong></td>
                <td class="text-right">
                  <span class="owner-name">{{ account.knowledge.owner }}</span>
                  <span class="owner-desc text-muted">{{ account.knowledge.description }}</span>
                </td>
              </tr>
              <tr>
                <td><strong>Address</strong></td>
                <td class="text-right">
                  {{ account.address }}
                  <CopyButton :text="account.address" />
                </td>
              </tr>
              <tr v-if="account.publicKey">
                <td><strong>Public Key</strong></td>
                <td class="text-right">
                  <span class="ellipsis public-key">{{ account.publicKey }}</span>
                  <CopyButton :text="account.publicKey" />
                </td>
              </tr>
              <tr>
                <td><strong>Total balance</strong></td>
                <td class="text-right">
                  {{ formatCurrency(account.balance, network.currency, network.decimalPlaces) }}
                  <span class="text-muted">{{ network.currency.symbol }}</span>
                </td>
              </tr>
              <tr>
                <td><strong>Transactions</strong></td>
                <td class="text-right">
                  <span title="Incoming" class="text-success">↓ {{ account.incoming_cnt }}</span>
                  <span title="Outgoing" class="text-danger">↑ {{ account.outgoing_cnt }}</span>
                </td>
              </tr>
              <tr v-if="account.delegate">
                <td><strong>Delegate</strong></td>
                <td class="text-right">
                  <router-link :to="`/delegate/${account.address}`">
                    {{ account.delegate.username }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="address-qr">
          <QrCode :content="qrContent" :size="200" />
          <div class="text-muted">(Scan for Address)</div>
        </div>
      </div>

      <VotesList :accounts="account.votes" title="Votes" />

      <div class="page-title">
        <h2>Transactions</h2>
        <div class="page-note">Note: Messaging and service transactions are hidden</div>
      </div>

      <div class="advanced-search">
        <button type="button" class="btn btn-link" @click="searchOpen = !searchOpen">
          {{ searchOpen ? 'Hide advanced search' : 'Advanced search' }}
        </button>
        <form v-if="searchOpen" class="advanced-search-form" @submit.prevent="runSearch">
          <input v-model.trim="search.senderId" placeholder="Sender address" />
          <input v-model.trim="search.recipientId" placeholder="Recipient address" />
          <input v-model.trim="search.minAmount" placeholder="Min amount (ADM)" />
          <input v-model.trim="search.maxAmount" placeholder="Max amount (ADM)" />
          <input v-model.trim="search.type" placeholder="Types, comma separated" />
          <div class="btn-row">
            <button type="submit" class="btn btn-primary">Search</button>
            <button type="button" class="btn" @click="resetSearch">Reset</button>
          </div>
        </form>
        <div v-if="searchError" class="alert alert-danger">{{ searchError }}</div>
      </div>

      <div class="btn-pair transactions-filter" :class="{ disabled: direction === 'search' }">
        <button type="button" class="btn" :disabled="!direction" @click="filterTxs()">All</button>
        <button
          type="button"
          class="btn"
          :disabled="direction === 'sent'"
          @click="filterTxs('sent')"
        >
          Sent
        </button>
        <button
          type="button"
          class="btn"
          :disabled="direction === 'received'"
          @click="filterTxs('received')"
        >
          Received
        </button>
        <button
          type="button"
          class="btn"
          :disabled="direction === 'others'"
          @click="filterTxs('others')"
        >
          Others
        </button>
      </div>

      <TransactionsList v-if="txs" :txs="txs" :address="account.address" />
    </template>
  </section>
</template>
