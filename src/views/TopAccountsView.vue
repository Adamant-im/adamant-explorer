<script setup>
// Top accounts by balance with summary context and incremental loading.
import { computed, nextTick, ref } from 'vue';
import { useNetworkStore } from '../stores/network';
import { apiGet } from '../lib/api';
import { useLessMore } from '../lib/lessMore';
import { formatCurrency, formatFullCurrency, supplyPercent, SAT } from '../lib/format';

const network = useNetworkStore();

const topAccounts = useLessMore({ url: '/api/getTopAccounts', key: 'accounts' });
topAccounts.loadData();

const totalSupply = ref(0);

// Total supply endpoint returns a plain ADM number, not sats
apiGet('/api/totalSupply')
  .then((value) => {
    totalSupply.value = Number(value) * SAT;
  })
  .catch(() => {});

const shownBalance = computed(() =>
  topAccounts.results.reduce((sum, account) => sum + Number(account.balance || 0), 0),
);
const shownShare = computed(() => supplyPercent(shownBalance.value, totalSupply.value));
const largestAccount = computed(() => topAccounts.results[0] ?? null);

/** Loads more rows without moving the reader away from the control. */
async function loadMore() {
  const scrollTop = window.scrollY;

  await topAccounts.loadMore();
  await nextTick();
  window.scrollTo({ top: scrollTop, behavior: 'instant' });
}
</script>

<template>
  <section>
    <div class="page-title">
      <h1>Top Accounts</h1>
      <div class="page-note">
        Total Supply: {{ formatCurrency(totalSupply, network.currency, 2) }} ADM
      </div>
    </div>
    <div class="account-insights">
      <article>
        <span>Accounts shown</span>
        <strong>{{ topAccounts.results.length }}</strong>
      </article>
      <article>
        <span>Combined balance</span>
        <strong>{{ formatCurrency(shownBalance, network.currency, 2) }} ADM</strong>
        <small>{{ shownShare }}% of total supply</small>
      </article>
      <article>
        <span>Largest account</span>
        <strong
          >{{
            largestAccount ? formatFullCurrency(largestAccount.balance, network.currency) : '—'
          }}
          ADM</strong
        >
        <small v-if="largestAccount">{{
          largestAccount.knowledge?.owner || largestAccount.address
        }}</small>
      </article>
    </div>

    <div v-if="topAccounts.results.length" class="table-responsive">
      <table class="table table-striped top-accounts">
        <thead>
          <tr>
            <th>Rank</th>
            <th class="text-right">Address</th>
            <th class="text-right">Balance</th>
            <th class="text-right hide-sm">Supply</th>
            <th class="text-right hide-md">Owner</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(account, index) in topAccounts.results" :key="account.address">
            <td>{{ index + 1 }}</td>
            <td class="text-right">
              <router-link :to="`/address/${account.address}`">{{ account.address }}</router-link>
            </td>
            <td class="text-right">
              {{ formatFullCurrency(account.balance, network.currency) }}
              <span class="text-muted">{{ network.currency.symbol }}</span>
            </td>
            <td class="text-right hide-sm">
              {{ supplyPercent(account.balance, network.blockStatus?.supply) }}%
            </td>
            <td class="text-right hide-md">
              <template v-if="account.knowledge">
                <span class="owner-name">{{ account.knowledge.owner }}</span>
                <span class="owner-desc text-muted">{{ account.knowledge.description }}</span>
              </template>
              <span v-else class="owner-unknown text-muted">Unlabelled account</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="topAccounts.loading" class="progress-loading">Loading accounts…</div>

    <div v-if="topAccounts.moreData" class="btn-pair">
      <button type="button" class="btn btn-primary" @click="loadMore">More</button>
    </div>
  </section>
</template>
