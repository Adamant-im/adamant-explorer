<script setup>
// Always-visible list of accounts, used for delegate votes and voters.
import { useNetworkStore } from '../stores/network.js';
import { accountLabel, formatFullCurrency } from '../lib/format';
import { accountPath } from '../lib/accounts';

defineProps({
  /** Accounts to list; nothing is rendered for an empty list. */
  accounts: { type: Array, default: () => [] },
  /** Section heading, e.g. `'Votes'` or `'Voters'`. */
  title: { type: String, required: true },
  /** Show voter address and balance in an information table. */
  detailed: { type: Boolean, default: false },
});

const network = useNetworkStore();
</script>

<template>
  <section v-if="accounts && accounts.length" class="votes-section">
    <h2>
      {{ title }} <small>{{ accounts.length }}</small>
    </h2>
    <div v-if="detailed" class="table-responsive">
      <table class="table voters-table">
        <thead>
          <tr>
            <th>Voter</th>
            <th>Address</th>
            <th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accounts" :key="account.address">
            <td>
              <router-link :to="accountPath(account)">{{ accountLabel(account) }}</router-link>
            </td>
            <td class="text-muted">{{ account.address }}</td>
            <td class="text-right">
              {{ formatFullCurrency(account.balance || 0, network.currency) }}
              <span class="text-muted">{{ network.currency.symbol }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="votes-list">
      <template v-for="(account, index) in accounts" :key="account.address">
        <router-link :to="accountPath(account)">{{ accountLabel(account) }}</router-link>
        <span v-if="index < accounts.length - 1" class="text-muted"> • </span>
      </template>
    </p>
  </section>
</template>
