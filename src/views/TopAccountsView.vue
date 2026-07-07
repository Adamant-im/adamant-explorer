<script setup>
// Top accounts by balance with Less/More paging and supply share.
import { ref } from 'vue';
import { useNetworkStore } from '../stores/network';
import { apiGet } from '../lib/api';
import { useLessMore } from '../lib/lessMore';
import { formatCurrency, supplyPercent, SAT } from '../lib/format';

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
</script>

<template>
  <section>
    <div class="page-title">
      <h1>Top Accounts</h1>
      <div class="page-note">
        Total Supply: {{ formatCurrency(totalSupply, network.currency, 2) }} ADM
      </div>
    </div>
    <hr />

    <div v-if="topAccounts.results.length" class="table-responsive">
      <table class="table table-striped top-accounts">
        <thead>
          <tr>
            <th>Rank</th>
            <th class="text-right">Address</th>
            <th class="text-right">~ Balance</th>
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
              {{ formatCurrency(account.balance, network.currency, 2) }}
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
              <span v-else class="owner-unknown text-muted">N/A</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="topAccounts.loading" class="progress-loading">Loading accounts…</div>

    <div v-if="!topAccounts.disabled()" class="btn-pair">
      <button
        type="button"
        class="btn"
        :disabled="!topAccounts.lessData"
        @click="topAccounts.loadLess()"
      >
        Less
      </button>
      <button
        type="button"
        class="btn"
        :disabled="!topAccounts.moreData"
        @click="topAccounts.loadMore()"
      >
        More
      </button>
    </div>
  </section>
</template>
