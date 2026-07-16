<script setup>
// Delegate Monitor: live forging state of the 101 active delegates plus
// standby delegates, fed by the `/delegateMonitor` socket namespace.
import { computed, ref } from 'vue';
import { useNetworkStore } from '../stores/network';
import { useSocket } from '../composables/useSocket';
import { apiGet } from '../lib/api';
import { useSort } from '../lib/sort';
import { formatCurrency, forgingTime, timeAgo, SAT } from '../lib/format';
import { forgingStatus, forgingTotals, forgingProgress } from '../lib/forging';
import TabsBar from '../components/TabsBar.vue';
import ForgingStatusDot from '../components/ForgingStatusDot.vue';

const network = useNetworkStore();

const activeDelegates = ref(null);
const totals = ref({ totalDelegates: 0, totalActive: 101, totalStandby: 0 });
const lastBlock = ref(null);
const registrations = ref(null);
const votes = ref(null);
const nextForgers = ref(null);

const standbyDelegates = ref(null);
const pagination = ref(null);

const tab = ref('active');
const tabs = [
  { id: 'active', label: 'Active Delegates' },
  { id: 'standby', label: 'Standby Delegates' },
];

const sortActive = useSort('rate');
const sortStandby = useSort('rate');

/** Attaches computed forging status to every active delegate. */
function withStatuses(delegates, height) {
  return delegates.map((delegate) => ({
    ...delegate,
    // Round the raw sats values the way the legacy monitor did
    votesWeight: Number((delegate.votesWeight / SAT).toFixed(0)) * SAT,
    forged: Number((delegate.forged / SAT).toFixed(4)) * SAT,
    forgingStatus: forgingStatus(delegate, height),
  }));
}

const socket = useSocket('/delegateMonitor');

socket.on('data', (res) => {
  if (res.lastBlock) {
    lastBlock.value = res.lastBlock.block;
  }
  if (res.active) {
    const height = lastBlock.value?.height ?? network.blockStatus?.height ?? 0;
    activeDelegates.value = withStatuses(res.active.delegates, height);

    const totalDelegates = res.active.totalCount || 0;
    totals.value = {
      totalDelegates,
      totalActive: 101,
      totalStandby: Math.max(totalDelegates - 101, 0),
    };
  }
  if (res.registrations) {
    registrations.value = res.registrations.transactions;
  }
  if (res.nextForgers) {
    nextForgers.value = res.nextForgers;
  }
  if (res.votes) {
    votes.value = res.votes.transactions;
  }
});

/** Loads a page of standby delegates over the REST API. */
async function getStandby(page = 1) {
  const offset = page > 1 ? (page - 1) * 20 : 0;
  standbyDelegates.value = null;

  try {
    const data = await apiGet('/api/delegates/getStandby', { n: offset });

    if (data.success) {
      standbyDelegates.value = data.delegates.map((delegate) => ({
        ...delegate,
        votesWeight: Number((delegate.votesWeight / SAT).toFixed(4)) * SAT,
      }));
    }

    pagination.value = data.pagination ?? null;
  } catch {
    standbyDelegates.value = [];
  }
}

getStandby(1);

const statusTotals = computed(() =>
  activeDelegates.value ? forgingTotals(activeDelegates.value) : null,
);
const processed = computed(() => (statusTotals.value ? forgingProgress(statusTotals.value) : 0));

const bestForger = computed(() => maxBy(activeDelegates.value, (d) => parseInt(d.forged)));
const totalForged = computed(() => network.blockStatus?.supply ?? 0);
const bestProductivity = computed(() => maxBy(activeDelegates.value, (d) => d.productivity));
const worstProductivity = computed(() => maxBy(activeDelegates.value, (d) => -d.productivity));

/** Returns the element with the highest score, or `null` for empty input. */
function maxBy(list, score) {
  if (!list?.length) {
    return null;
  }

  return list.reduce((a, b) => (score(a) >= score(b) ? a : b));
}

/** Formats a sats value with the page's currency settings. */
function amount(value) {
  return formatCurrency(value || 0, network.currency, network.decimalPlaces);
}

const sortedActive = computed(() => sortActive.sorted(activeDelegates.value));
const sortedStandby = computed(() => sortStandby.sorted(standbyDelegates.value));

const activeColumns = [
  { key: 'rate', label: 'Rank' },
  { key: 'username', label: 'Name' },
  { key: 'address', label: 'Address', hide: 'hide-sm' },
  { key: 'forged', label: 'Forged', hide: 'hide-md' },
  { key: 'forgingTime', label: 'Forging time', hide: 'hide-md' },
  { key: 'forgingStatus.code', label: 'Status' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'approval', label: 'Approval', hide: 'hide-sm' },
];

const standbyColumns = [
  { key: 'rate', label: 'Rank' },
  { key: 'username', label: 'Name' },
  { key: 'address', label: 'Address', hide: 'hide-sm' },
  { key: 'productivity', label: 'Productivity', hide: 'hide-sm' },
  { key: 'approval', label: 'Approval', hide: 'hide-sm' },
];
</script>

<template>
  <section>
    <h1>Delegate Monitor</h1>
    <hr />

    <div class="cards-grid">
      <div class="big-info">
        <p class="small-title">Delegates</p>
        <p class="big-details">{{ totals.totalDelegates || 0 }}</p>
        <p class="text-muted">{{ totals.totalActive }} active delegates</p>
        <p class="text-muted">{{ totals.totalStandby }} delegates on standby</p>
      </div>

      <div class="big-info">
        <p class="small-title">Last Block By</p>
        <p class="big-details">
          <router-link v-if="lastBlock" :to="`/delegate/${lastBlock.delegate.address}`">
            {{ lastBlock.delegate.username }}
          </router-link>
          <span v-else class="text-muted">N/A</span>
        </p>
        <p class="text-muted">
          <router-link v-if="lastBlock" :to="`/block/${lastBlock.id}`">
            {{ lastBlock.id }}
          </router-link>
          <span v-else>N/A</span>
        </p>
        <p class="text-muted">
          <span class="accent">
            {{ amount(lastBlock?.totalForged) }} {{ network.currency.symbol }} forged
          </span>
          from {{ lastBlock?.numberOfTransactions || 0 }} transactions
        </p>
      </div>

      <div class="big-info">
        <p class="small-title">Next Forgers</p>
        <div v-if="!nextForgers">Waiting for next forgers <span class="spinner"></span></div>
        <template v-else>
          <p class="big-details">
            <router-link :to="`/delegate/${nextForgers[0].address}`">
              {{ nextForgers[0].username }}
            </router-link>
          </p>
          <p>
            <template v-for="(forger, index) in nextForgers.slice(1)" :key="forger.address">
              <router-link :to="`/delegate/${forger.address}`">{{ forger.username }}</router-link>
              <span v-if="index < nextForgers.length - 2" class="text-muted"> • </span>
            </template>
          </p>
        </template>
      </div>

      <div class="big-info">
        <p class="small-title">
          Total Forged <span class="text-muted">({{ network.currency.symbol }})</span>
        </p>
        <p class="big-details accent">{{ amount(totalForged) }}</p>
        <p class="text-muted">network-wide current supply</p>
      </div>

      <div class="big-info">
        <p class="small-title">Best Forger</p>
        <p class="big-details">
          <router-link v-if="bestForger" :to="`/delegate/${bestForger.address}`">
            {{ bestForger.username }}
          </router-link>
          <span v-else class="text-muted">N/A</span>
        </p>
        <p class="text-muted accent">
          {{ amount(bestForger?.forged) }} {{ network.currency.symbol }} forged
        </p>
        <p class="text-muted">since registration</p>
      </div>

      <div class="big-info">
        <p class="small-title">Productivity</p>
        <div class="productivity-pair">
          <div>
            <p class="big-details">{{ bestProductivity?.productivity || 0 }}%</p>
            <p>
              <span class="text-muted">best by</span>
              <router-link v-if="bestProductivity" :to="`/delegate/${bestProductivity.address}`">
                {{ bestProductivity.username }}
              </router-link>
              <span v-else class="text-muted">N/A</span>
            </p>
          </div>
          <div>
            <p class="big-details">{{ worstProductivity?.productivity || 0 }}%</p>
            <p>
              <span class="text-muted">worst by</span>
              <router-link v-if="worstProductivity" :to="`/delegate/${worstProductivity.address}`">
                {{ worstProductivity.username }}
              </router-link>
              <span v-else class="text-muted">N/A</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="cards-grid two-columns">
      <div class="big-info">
        <p class="small-title">Latest Votes</p>
        <div class="table-responsive">
          <table class="table condensed">
            <thead>
              <tr>
                <th>Voter</th>
                <th class="hide-sm">Transaction</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!votes">
                <td colspan="3">Waiting for votes <span class="spinner"></span></td>
              </tr>
              <tr v-for="vote in votes" :key="vote.id">
                <td>
                  <router-link
                    v-if="vote.delegate?.username"
                    :to="`/delegate/${vote.delegate.address}`"
                  >
                    {{ vote.delegate.username }}
                  </router-link>
                  <router-link v-else-if="vote.senderId" :to="`/address/${vote.senderId}`">
                    {{ vote.senderId }}
                  </router-link>
                </td>
                <td class="hide-sm">
                  <router-link class="ellipsis" :to="`/tx/${vote.id}`">{{ vote.id }}</router-link>
                </td>
                <td>
                  <span class="text-muted">{{ timeAgo(vote.timestamp) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="big-info">
        <p class="small-title">Newest Delegates</p>
        <div class="table-responsive">
          <table class="table condensed">
            <thead>
              <tr>
                <th>Delegate</th>
                <th class="hide-sm">Transaction</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!registrations">
                <td colspan="3">Waiting for registrations <span class="spinner"></span></td>
              </tr>
              <tr v-for="reg in registrations" :key="reg.id">
                <td>
                  <router-link :to="`/delegate/${reg.delegate.address}`">
                    {{ reg.delegate.username }}
                  </router-link>
                </td>
                <td class="hide-sm">
                  <router-link class="ellipsis" :to="`/tx/${reg.id}`">{{ reg.id }}</router-link>
                </td>
                <td>
                  <span class="text-muted">{{ timeAgo(reg.timestamp) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <TabsBar v-model="tab" :tabs="tabs" />

    <div v-if="tab === 'active'" class="tab-content">
      <div v-if="statusTotals" class="forging-totals">
        <div class="forging-total green">
          <p class="big-details">{{ statusTotals.forging }}</p>
          <span>Forged block recently</span>
        </div>
        <div class="forging-total orange">
          <p class="big-details">{{ statusTotals.missedBlock }}</p>
          <span>Missed a recent slot</span>
        </div>
        <div class="forging-total red">
          <p class="big-details">{{ statusTotals.notForging }}</p>
          <span>Not forging</span>
        </div>
        <div class="forging-total grey">
          <p class="big-details">{{ statusTotals.awaitingSlot }}</p>
          <span>Awaiting current-round slot</span>
        </div>
      </div>

      <div v-if="processed > 0" class="forging-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${(processed / 101) * 100}%` }">
            <span>{{ processed }} / 101 {{ processed < 101 ? 'updating…' : 'up-to-date' }}</span>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th
                v-for="column in activeColumns"
                :key="column.key"
                role="button"
                :class="column.hide"
                @click="sortActive.order(column.key)"
              >
                {{ column.label }}
                <span v-if="sortActive.key === column.key" class="sort-arrow">{{
                  sortActive.reverse ? '▴' : '▾'
                }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!activeDelegates">
              <td colspan="8">Waiting for delegates <span class="spinner"></span></td>
            </tr>
            <tr v-for="delegate in sortedActive" :key="delegate.rate">
              <td>{{ delegate.rate }}</td>
              <td>
                <router-link :to="`/delegate/${delegate.address}`">
                  {{ delegate.username }}
                </router-link>
              </td>
              <td class="hide-sm">
                <span class="text-muted">{{ delegate.address }}</span>
              </td>
              <td class="hide-md">
                {{ amount(delegate.forged) }}
                <span class="text-muted">{{ network.currency.symbol }}</span>
              </td>
              <td class="hide-md">{{ forgingTime(delegate.forgingTime) }}</td>
              <td><ForgingStatusDot :status="delegate.forgingStatus" /></td>
              <td>{{ delegate.productivity || 0 }}%</td>
              <td class="hide-sm">
                <span :title="`${amount(delegate.votesWeight)} ${network.currency.symbol}`">
                  {{ delegate.approval }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="tab-content">
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th
                v-for="column in standbyColumns"
                :key="column.key"
                role="button"
                :class="column.hide"
                @click="sortStandby.order(column.key)"
              >
                {{ column.label }}
                <span v-if="sortStandby.key === column.key" class="sort-arrow">{{
                  sortStandby.reverse ? '▴' : '▾'
                }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!standbyDelegates">
              <td colspan="5">Waiting for delegates <span class="spinner"></span></td>
            </tr>
            <tr v-for="delegate in sortedStandby" :key="delegate.rate">
              <td>{{ delegate.rate }}</td>
              <td>
                <router-link :to="`/delegate/${delegate.address}`">
                  {{ delegate.username }}
                </router-link>
              </td>
              <td class="hide-sm">
                <span class="text-muted">{{ delegate.address }}</span>
              </td>
              <td class="hide-sm">{{ delegate.productivity || 0 }}%</td>
              <td class="hide-sm">
                <span :title="`${amount(delegate.votesWeight)} ${network.currency.symbol}`">
                  {{ delegate.approval }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination && (pagination.more || pagination.before)" class="pagination-links">
        <button
          v-if="pagination.before"
          type="button"
          class="btn btn-primary"
          @click="getStandby(pagination.previousPage)"
        >
          Previous page
        </button>
        <button
          v-if="pagination.more"
          type="button"
          class="btn btn-primary"
          @click="getStandby(pagination.nextPage)"
        >
          Next page
        </button>
      </div>
    </div>
  </section>
</template>
