<script setup>
// Collapsible list of accounts, used for delegate votes and voters.
import { ref } from 'vue';
import { accountLabel } from '../lib/format';
import { accountPath } from '../lib/accounts';

defineProps({
  /** Accounts to list; nothing is rendered for an empty list. */
  accounts: { type: Array, default: () => [] },
  /** Section heading, e.g. `'Votes'` or `'Voters'`. */
  title: { type: String, required: true },
});

const open = ref(false);
</script>

<template>
  <section v-if="accounts && accounts.length" class="votes-section">
    <h2>
      <button type="button" class="votes-toggle" :aria-expanded="open" @click="open = !open">
        {{ open ? '−' : '+' }}
      </button>
      {{ title }} <small>{{ accounts.length }}</small>
    </h2>
    <p v-if="open" class="votes-list">
      <template v-for="(account, index) in accounts" :key="account.address">
        <router-link :to="accountPath(account)">{{ accountLabel(account) }}</router-link>
        <span v-if="index < accounts.length - 1" class="text-muted"> • </span>
      </template>
    </p>
  </section>
</template>
