<script setup>
// Delegate page: delegate summary, their votes, and their voters.
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNetworkStore } from '../stores/network';
import { apiGetOrThrow } from '../lib/api';
import { formatCurrency } from '../lib/format';
import VotesList from '../components/VotesList.vue';

const route = useRoute();
const router = useRouter();
const network = useNetworkStore();

const account = ref(null);

/**
 * Loads the account; a non-delegate address is redirected to the plain
 * address page, an unknown one to home — same as the legacy explorer.
 */
async function getAccount(address) {
  account.value = null;

  try {
    const data = await apiGetOrThrow('/api/getAccount', { address });

    if (!data.delegate) {
      router.replace(`/address/${address}`);
      return;
    }

    account.value = data;
  } catch {
    router.replace('/');
  }
}

watch(() => route.params.delegateId, getAccount, { immediate: true });

/** Formats a sats value with the page's currency settings. */
function amount(value) {
  return formatCurrency(value || 0, network.currency, network.decimalPlaces);
}
</script>

<template>
  <section>
    <div v-if="!account" class="text-muted">Loading delegate <span class="spinner"></span></div>

    <template v-else>
      <h2>Delegate</h2>
      <div class="table-responsive">
        <table class="table summary">
          <tbody>
            <tr>
              <td><strong>Name</strong></td>
              <td class="text-right">{{ account.delegate.username }}</td>
            </tr>
            <tr>
              <td><strong>Address</strong></td>
              <td class="text-right">
                <router-link :to="`/address/${account.address}`">{{ account.address }}</router-link>
              </td>
            </tr>
            <tr>
              <td><strong>Uptime</strong></td>
              <td class="text-right">{{ account.delegate.productivity || 0 }}%</td>
            </tr>
            <tr>
              <td><strong>Rank / Status</strong></td>
              <td class="text-right">
                {{ account.delegate.rate }} /
                <span class="text-muted">
                  {{ account.delegate.rate <= 101 ? 'Active' : 'Standby' }}
                </span>
              </td>
            </tr>
            <tr>
              <td><strong>Approval</strong></td>
              <td class="text-right">{{ account.delegate.approval }}%</td>
            </tr>
            <tr>
              <td><strong>Vote weight (Obsolete)</strong></td>
              <td class="text-right">
                {{ amount(account.delegate.vote) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
            </tr>
            <tr>
              <td><strong>Vote weight (Fair Delegate System)</strong></td>
              <td class="text-right">
                {{ amount(account.delegate.votesWeight) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
            </tr>
            <tr>
              <td><strong>Forged</strong></td>
              <td class="text-right">
                {{ amount(account.delegate.forged) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
            </tr>
            <tr>
              <td><strong>Blocks</strong></td>
              <td class="text-right">
                {{ account.delegate.producedblocks }}
                <span class="text-muted">({{ account.delegate.missedblocks }} missed)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <VotesList :accounts="account.votes" title="Votes" />
      <VotesList :accounts="account.voters" title="Voters" detailed />
    </template>
  </section>
</template>
