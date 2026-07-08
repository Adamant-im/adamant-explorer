<script setup>
// Reserved ADAMANT wallets with live balances.
import { reactive } from 'vue';
import { useNetworkStore } from '../stores/network';
import { apiGet } from '../lib/api';
import { formatCurrency } from '../lib/format';

const network = useNetworkStore();

/**
 * Well-known project wallets. The list is static by design: these
 * addresses are part of the ADAMANT token distribution announcement.
 */
const wallets = reactive(
  [
    { name: 'Development and Support', address: 'U2065436277795836384', description: 'ADAMANT' },
    { name: 'Marketing', address: 'U8842529089226485961', description: 'ADAMANT' },
    { name: 'Investors', address: 'U8842068055848619621', description: 'ADAMANT' },
    { name: 'Adoption and Bounty', address: 'U15423595369615486571', description: 'ADAMANT' },
    { name: 'Donates', address: 'U1973842998847463129', description: 'ADAMANT' },
    {
      name: 'Adoption (Hot wallet)',
      address: 'U1835325601873095435',
      description: 'ADAMANT Foundation',
    },
    { name: 'Adoption', address: 'U5875207477212018391', description: 'ADAMANT Foundation' },
    { name: 'Marketing', address: 'U8181868247557556851', description: 'ADAMANT Foundation' },
    { name: 'Development', address: 'U9701591031505109687', description: 'ADAMANT Foundation' },
    { name: 'Donates', address: 'U380651761819723095', description: 'ADAMANT Foundation' },
  ].map((wallet) => ({ ...wallet, balance: 0 })),
);

for (const wallet of wallets) {
  apiGet('/api/getAccount', { address: wallet.address })
    .then((data) => {
      if (data.success) {
        wallet.balance = Number(data.balance);
      }
    })
    .catch(() => {});
}
</script>

<template>
  <section>
    <div class="page-title">
      <h1>Reserved ADAMANT Wallets</h1>
    </div>
    <hr />
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th class="text-left hide-sm">Id</th>
            <th class="text-right">Address</th>
            <th class="text-right">Balance (ADM)</th>
            <th class="text-right">Name</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(wallet, index) in wallets" :key="wallet.address">
            <td class="text-left hide-sm">#{{ index + 1 }}</td>
            <td class="text-right">
              <router-link :to="`/address/${wallet.address}`">{{ wallet.address }}</router-link>
            </td>
            <td class="text-right">
              {{ formatCurrency(wallet.balance, network.currency, 2) }}
              <span class="text-muted">{{ network.currency.symbol }}</span>
            </td>
            <td class="text-right">
              {{ wallet.name }}
              <span class="owner-desc text-muted">{{ wallet.description }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
