<script setup>
// Address page: account summary, QR code, votes, and transaction history.
import { computed, ref, watch } from 'vue';
import { IconArrowDown, IconArrowUp, IconLock } from '@tabler/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import { useNetworkStore } from '../stores/network';
import { apiGetOrThrow } from '../lib/api';
import { useLessMore } from '../lib/lessMore';
import { formatFullCurrency, formatInteger } from '../lib/format';
import CopyButton from '../components/CopyButton.vue';
import QrCode from '../components/QrCode.vue';
import VotesList from '../components/VotesList.vue';
import TransactionsList from '../components/TransactionsList.vue';

const route = useRoute();
const router = useRouter();
const network = useNetworkStore();

const account = ref(null);
const txs = ref(null);
/** Active direction filter: '', 'sent', 'received', or 'others'. */
const direction = ref('');

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
    url: dir === 'others' ? '/api/getTransactionsByAddress' : '/api/getTransfersByAddress',
    key: 'transactions',
    parent: 'address',
    params: { address: route.params.address, direction: dir || undefined },
  });
  txs.value.loadData();
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
        <small v-if="account.secondSignature" title="Second signature">
          <IconLock class="inline-icon" aria-label="Second signature" />
        </small>
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
                  <span class="public-key">{{ account.publicKey }}</span>
                  <CopyButton :text="account.publicKey" />
                </td>
              </tr>
              <tr>
                <td><strong>Total balance</strong></td>
                <td class="text-right">
                  {{ formatFullCurrency(account.balance, network.currency) }}
                  <span class="text-muted">{{ network.currency.symbol }}</span>
                </td>
              </tr>
              <tr>
                <td><strong>Transactions</strong></td>
                <td class="text-right">
                  <span title="Incoming" class="text-success">
                    <IconArrowDown class="inline-icon" aria-hidden="true" />
                    {{ formatInteger(account.incoming_cnt) }}
                  </span>
                  <span title="Outgoing" class="text-danger">
                    <IconArrowUp class="inline-icon" aria-hidden="true" />
                    {{ formatInteger(account.outgoing_cnt) }}
                  </span>
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
        <div class="page-note">Messages are hidden; Others shows service operations</div>
      </div>

      <div class="btn-pair transactions-filter">
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
