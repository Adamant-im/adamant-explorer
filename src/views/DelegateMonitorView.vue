<script setup>
// Delegate Monitor: live forging state of the 101 active delegates plus
// standby delegates, fed by the `/delegateMonitor` socket namespace.
import { computed, ref } from 'vue';
import { useNetworkStore } from '../stores/network';
import { useSocket } from '../composables/useSocket';
import { apiGet } from '../lib/api';
import { useSort } from '../lib/sort';
import { formatCurrency, formatInteger, forgingTime, SAT } from '../lib/format';
import { forgingStatus, forgingTotals, forgingProgress, totalBlockRewards } from '../lib/forging';
import TabsBar from '../components/TabsBar.vue';
import ForgingStatusDot from '../components/ForgingStatusDot.vue';
import SortIndicator from '../components/SortIndicator.vue';
import TimestampValue from '../components/TimestampValue.vue';

const network = useNetworkStore();

const activeDelegates = ref(null);
const totals = ref({ totalDelegates: 0, totalActive: 101, totalStandby: 0 });
const lastBlock = ref(null);
const registrations = ref(null);
const votes = ref(null);
const nextForgers = ref(null);
const forgingStatistics = ref(null);

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
  if (res.forgingTotals?.success) {
    forgingStatistics.value = res.forgingTotals;
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
const collectingHistory = computed(() => statusTotals.value?.unprocessed ?? 101);

const bestForger = computed(() => maxBy(activeDelegates.value, (d) => parseInt(d.forged)));
const totalForged = computed(() => totalBlockRewards(network.blockStatus?.supply));
const transactionFees = computed(() => forgingStatistics.value?.transactionFees ?? 0);
const averageProductivity = computed(() => {
  if (!activeDelegates.value?.length) {
    return 0;
  }

  const total = activeDelegates.value.reduce(
    (sum, delegate) => sum + Number(delegate.productivity || 0),
    0,
  );

  return (total / activeDelegates.value.length).toFixed(2);
});

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
  { key: 'rate', label: 'Rank', class: 'text-center' },
  { key: 'username', label: 'Name' },
  { key: 'address', label: 'Address', hide: 'hide-sm' },
  { key: 'forged', label: 'Forged', hide: 'hide-md' },
  { key: 'forgingTime', label: 'Forging time', hide: 'hide-md' },
  { key: 'forgingStatus.code', label: 'Status' },
  { key: 'productivity', label: 'Productivity' },
  { key: 'approval', label: 'Approval', hide: 'hide-sm' },
];

const standbyColumns = [
  { key: 'rate', label: 'Rank', class: 'text-center' },
  { key: 'username', label: 'Name' },
  { key: 'address', label: 'Address', hide: 'hide-sm' },
  { key: 'productivity', label: 'Productivity', hide: 'hide-sm' },
  { key: 'approval', label: 'Approval', hide: 'hide-sm' },
];
</script>

<template>
  <section class="delegate-monitor">
    <header class="monitor-title">
      <div>
        <span class="monitor-kicker">DPoS control room</span>
        <h1>Delegate Monitor</h1>
      </div>
      <p>Live forging coverage across the active set and the delegates waiting to enter it</p>
    </header>

    <div class="delegate-command">
      <div class="round-readout">
        <span class="small-title">Status coverage</span>
        <strong>{{ processed }}<small>/ 101 classified</small></strong>
        <div class="classification-track">
          <i :style="{ width: `${(processed / 101) * 100}%` }"></i>
        </div>
        <p>{{ collectingHistory }} collecting at least five rounds of history</p>
      </div>
      <div v-if="statusTotals" class="status-band">
        <div class="green">
          <strong>{{ statusTotals.forging }}</strong
          ><span>Forging</span>
        </div>
        <div class="orange">
          <strong>{{ statusTotals.missedBlock }}</strong
          ><span>Recent misses</span>
        </div>
        <div class="red">
          <strong>{{ statusTotals.notForging }}</strong
          ><span>Not forging</span>
        </div>
        <div class="grey">
          <strong>{{ statusTotals.awaitingSlot }}</strong
          ><span>Awaiting slot</span>
        </div>
      </div>
      <div class="forger-queue">
        <span class="small-title">Next forging queue</span>
        <ol v-if="nextForgers">
          <li v-for="forger in nextForgers.slice(0, 5)" :key="forger.address">
            <router-link :to="`/delegate/${forger.address}`">{{ forger.username }}</router-link>
          </li>
        </ol>
        <p v-else>Waiting for schedule <span class="spinner"></span></p>
      </div>
    </div>

    <div class="delegate-metrics">
      <article>
        <span>Delegate registry</span>
        <strong>{{ formatInteger(totals.totalDelegates || 0) }}</strong>
        <small>{{ totals.totalActive }} active · {{ totals.totalStandby }} standby</small>
      </article>
      <article>
        <span>Last block by</span>
        <router-link v-if="lastBlock" :to="`/delegate/${lastBlock.delegate.address}`">
          {{ lastBlock.delegate.username }}
        </router-link>
        <strong v-else>—</strong>
        <small v-if="lastBlock">
          <router-link :to="`/block/${lastBlock.id}`">{{ lastBlock.id }}</router-link>
          · {{ formatInteger(lastBlock.numberOfTransactions || 0) }} txs
        </small>
      </article>
      <article>
        <span>Minted rewards</span>
        <strong>{{ amount(totalForged) }} {{ network.currency.symbol }}</strong>
        <small>Since genesis</small>
      </article>
      <article>
        <span>Average productivity</span>
        <strong>{{ averageProductivity }}%</strong>
        <small>Across the active delegate set</small>
      </article>
      <article>
        <span>Best forger</span>
        <router-link v-if="bestForger" :to="`/delegate/${bestForger.address}`">
          {{ bestForger.username }}
        </router-link>
        <strong v-else>—</strong>
        <small>{{ amount(bestForger?.forged) }} {{ network.currency.symbol }} forged</small>
      </article>
      <article>
        <span>Transaction fees</span>
        <strong>{{ amount(transactionFees) }} {{ network.currency.symbol }}</strong>
        <small>Earned by delegates in addition to minted rewards</small>
      </article>
    </div>

    <div class="delegate-events-rail">
      <div class="delegate-events">
        <article>
          <p class="small-title">Latest votes</p>
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
                    <TimestampValue class="text-muted" :timestamp="vote.timestamp" relative />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article>
          <p class="small-title">Newest delegates</p>
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
                    <TimestampValue class="text-muted" :timestamp="reg.timestamp" relative />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>

    <TabsBar v-model="tab" :tabs="tabs" />

    <div v-if="tab === 'active'" class="tab-content">
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th
                v-for="column in activeColumns"
                :key="column.key"
                role="button"
                :class="[column.hide, column.class]"
                @click="sortActive.order(column.key)"
              >
                {{ column.label }}
                <SortIndicator v-if="sortActive.key === column.key" :reverse="sortActive.reverse" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!activeDelegates">
              <td colspan="8">Waiting for delegates <span class="spinner"></span></td>
            </tr>
            <tr v-for="delegate in sortedActive" :key="delegate.rate">
              <td class="text-center">{{ delegate.rate }}</td>
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
                <span
                  v-tooltip="{
                    content: `${amount(delegate.votesWeight)} ${network.currency.symbol}`,
                    tone: 'blue',
                  }"
                >
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
                :class="[column.hide, column.class]"
                @click="sortStandby.order(column.key)"
              >
                {{ column.label }}
                <SortIndicator
                  v-if="sortStandby.key === column.key"
                  :reverse="sortStandby.reverse"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!standbyDelegates">
              <td colspan="5">Waiting for delegates <span class="spinner"></span></td>
            </tr>
            <tr v-for="delegate in sortedStandby" :key="delegate.rate">
              <td class="text-center">{{ delegate.rate }}</td>
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
                <span
                  v-tooltip="{
                    content: `${amount(delegate.votesWeight)} ${network.currency.symbol}`,
                    tone: 'blue',
                  }"
                >
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
