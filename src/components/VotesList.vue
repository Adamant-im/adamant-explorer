<script setup>
// Always-visible list of accounts, used for delegate votes and voters.
import { accountLabel } from '../lib/format';
import { accountPath } from '../lib/accounts';
import HomeAmount from './HomeAmount.vue';
import IdentityCell from './IdentityCell.vue';

defineProps({
  /** Accounts to list; nothing is rendered for an empty list. */
  accounts: { type: Array, default: () => [] },
  /** Section heading, e.g. `'Votes'` or `'Voters'`. */
  title: { type: String, required: true },
  /** Show voter address and balance in an information table. */
  detailed: { type: Boolean, default: false },
});
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
            <th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accounts" :key="account.address">
            <td>
              <IdentityCell
                :address="account.address"
                :label="accountLabel(account)"
                :path="accountPath(account)"
              />
            </td>
            <td class="text-right"><HomeAmount :amount="account.balance || 0" /></td>
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
